import { chatCompletion, parseJSON, SYSTEM_PROMPTS } from "../utils/aiService.js";
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import AIInsight from "../models/AIInsight.js";
import { lastNDays, calcStreak, todayKey } from "../utils/dateHelpers.js";




const buildWeeklyContext = async (userId) => {
    const habits = await Habit.find({ userId, isArchived: false });
    const days = lastNDays(7);
    const logs = await HabitLog.find({
        userId,
        completedDate: { $gte: days[0], $lte: days[days.length - 1] },
    });

    const perHabit = habits.map((h) => {
        const habitLogs = logs.filter(
            (l) => String(l.habitId) === String(h._id)
        );
        const dateKeys = habitLogs.map((l) => l.completedDate);
        const { current } = calcStreak(dateKeys);
        return {
            name: h.name,
            category: h.category,
            frequency: h.frequency,
            completedDays: habitLogs.length,
            currentStreak: current,
            targetDays: h.targetDays,
        };
    });
    return { days, perHabit };
};


export const weeklyReport = async (req, res) => {
    try{
        const ctx = await buildWeeklyContext(req.user._id);
        if(!ctx.perHabit.length){
            return res.json({
                content:
                "You don't have any active habits yet. Create your first habit to start tracking - I'll generate a weekly report once you have some data.",
            });
        }
        const userMsg = `Here is the user's habit data for the past 7 days (${ctx.days[0]} to ${ctx.days[6]}): \n\n${ctx.perHabit
         .map(
           (h) => 
             `- ${h.name} (${h.category}, ${h.frequency}): completed ${h.completedDays} of the past 7 days, target ${h.targetDays}/week`
          )
          .join("\n")}\n\nPlease write the personalised weekly report now.`;

        const response = await chatCompletion({
            system: SYSTEM_PROMPTS.weekly,
            user: userMsg,
        });

        if (!response.ok) {
            return res.status(503).json({ message: response.content });
        }

        await AIInsight.create({
            userId: req.user._id,
            type: "weekly",
            content: response.content,
        });
        res.json({ content: response.content });
    }catch (err){
        res.status(500).json({message: err.message});
    }
};


export const suggestHabits = async (req, res) => {
    try {
        const { goals, productiveTime, struggles } = req.body;

        if (!goals || !productiveTime || !struggles) {
            return res.status(400).json({
                ok: false,
                message: "goals, productiveTime, and struggles are required"
            });
        }

        const userPrompt = `
Goals: ${goals}
Most productive time: ${productiveTime}
Past struggles: ${struggles}
        `.trim();

        const response = await chatCompletion({
            system: SYSTEM_PROMPTS.suggestion,
            user: userPrompt,
            temperature: 0.7
        });

        if (!response.ok) {
            return res.status(500).json({
                ok: false,
                message: response.content
            });
        }

        const parsed = parseJSON(response.content);
        return res.json({
            ok: true,
            suggestions: parsed.suggestions || []
        });
    } catch (err) {
        console.error("Suggest habits error:", err.message);
        return res.status(500).json({
            ok: false,
            message: "Failed to generate habit suggestions"
        });
    }
};

export const recoveryPlan = async (req, res) => {
    try {
        const { habitId } = req.params;

        if (!habitId) {
            return res.status(400).json({
                ok: false,
                message: "habitId is required"
            });
        }

        const habit = await Habit.findById(habitId);
        if (!habit || String(habit.userId) !== String(req.user._id)) {
            return res.status(404).json({
                ok: false,
                message: "Habit not found"
            });
        }

        const userPrompt = `
The user broke their streak on the habit: "${habit.name}" (${habit.category}, ${habit.frequency}).
Target: ${habit.targetDays} times per week.
Help them recover with a personalized 3-day plan.
        `.trim();

        const response = await chatCompletion({
            system: SYSTEM_PROMPTS.recovery,
            user: userPrompt,
            temperature: 0.7
        });

        if (!response.ok) {
            return res.status(500).json({
                ok: false,
                message: response.content
            });
        }

        await AIInsight.create({
            userId: req.user._id,
            type: "recovery",
            content: response.content,
            meta: { habitId },
        });

        return res.json({
            ok: true,
            content: response.content
        });
    } catch (err) {
        console.error("Recovery plan error:", err.message);
        return res.status(500).json({
            ok: false,
            message: "Failed to generate recovery plan"
        });
    }
};

export const chatAnalysis = async (req, res) => {
    try {
        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({
                ok: false,
                message: "question is required"
            });
        }

        const ctx = await buildWeeklyContext(req.user._id);

        if (!ctx.perHabit.length) {
            return res.json({
                ok: true,
                content: "You don't have any active habits yet. Create your first habit to start tracking and I can answer questions about your progress."
            });
        }

        const habitData = ctx.perHabit
            .map(
                (h) =>
                    `- ${h.name} (${h.category}, ${h.frequency}): completed ${h.completedDays} of the past 7 days, target ${h.targetDays}/week`
            )
            .join("\n");

        const userPrompt = `
Here is the user's habit data for the past 7 days (${ctx.days[0]} to ${ctx.days[6]}):

${habitData}

User's question: ${question}
        `.trim();

        const response = await chatCompletion({
            system: SYSTEM_PROMPTS.chat,
            user: userPrompt,
            temperature: 0.7
        });

        if (!response.ok) {
            return res.status(500).json({
                ok: false,
                message: response.content
            });
        }

        await AIInsight.create({
            userId: req.user._id,
            type: "chat",
            content: response.content,
            meta: { question: question.trim() },
        });

        return res.json({
            ok: true,
            content: response.content
        });
    } catch (err) {
        console.error("Chat analysis error:", err.message);
        return res.status(500).json({
            ok: false,
            message: "Failed to analyze habits"
        });
    }
};

export const morningMotivation = async (req, res) => {
    try {
        const ctx = await buildWeeklyContext(req.user._id);

        if (!ctx.perHabit.length) {
            return res.json({
                ok: true,
                content: "Good morning! Start building your first habit today. You've got this! 💪"
            });
        }

        const habitData = ctx.perHabit
            .map((h) => `${h.name} (streak: ${h.currentStreak} days)`)
            .join(", ");

        const userPrompt = `
User's current habits: ${habitData}

Write a short, energizing morning message to motivate them to stay on track today.
        `.trim();

        const response = await chatCompletion({
            system: SYSTEM_PROMPTS.morning,
            user: userPrompt,
            temperature: 0.8
        });

        if (!response.ok) {
            return res.status(500).json({
                ok: false,
                message: response.content
            });
        }

        await AIInsight.create({
            userId: req.user._id,
            type: "morning",
            content: response.content,
        });

        return res.json({
            ok: true,
            content: response.content
        });
    } catch (err) {
        console.error("Morning motivation error:", err.message);
        return res.status(500).json({
            ok: false,
            message: "Failed to generate morning message"
        });
    }
};
