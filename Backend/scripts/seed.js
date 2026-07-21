import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import { todayKey, toDateKey } from "../utils/dateHelpers.js";
import { subDays } from "date-fns";

const uri =
  process.env.MONGO_URI ||
  process.env.MONGO_URI_LOCAL ||
  "mongodb://127.0.0.1:27017/aihabittracker";

const seed = async () => {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  await Promise.all([
    HabitLog.deleteMany({}),
    Habit.deleteMany({}),
    User.deleteMany({ email: "demo@aihabittracker.com" }),
  ]);

  const user = await User.create({
    name: "Demo User",
    email: "demo@aihabittracker.com",
    password: "demo123456",
    avatar: "D",
    morningMotivation: true,
  });

  const habits = await Habit.insertMany([
    {
      userId: user._id,
      name: "Drink Water",
      description: "8 glasses throughout the day",
      category: "Health",
      frequency: "daily",
      targetDays: 7,
      color: "#0ea5e9",
      icon: "💧",
      order: 0,
    },
    {
      userId: user._id,
      name: "Morning Walk",
      description: "20 minutes outside",
      category: "Fitness",
      frequency: "daily",
      targetDays: 5,
      color: "#10b981",
      icon: "🚶",
      order: 1,
    },
    {
      userId: user._id,
      name: "Read",
      description: "Read for 15 minutes",
      category: "Learning",
      frequency: "daily",
      targetDays: 7,
      color: "#6366f1",
      icon: "📚",
      order: 2,
    },
  ]);

  const logs = [];
  for (const habit of habits) {
    for (let i = 0; i < 14; i += 1) {
      if (i % 3 === 0) continue;
      logs.push({
        userId: user._id,
        habitId: habit._id,
        completedDate: toDateKey(subDays(new Date(), i)),
      });
    }
    logs.push({
      userId: user._id,
      habitId: habit._id,
      completedDate: todayKey(),
    });
  }

  await HabitLog.insertMany(logs);

  console.log("Seed complete");
  console.log("  Email:    demo@aihabittracker.com");
  console.log("  Password: demo123456");
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
