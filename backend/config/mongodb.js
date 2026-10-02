import mongoose from "mongoose";

const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log("DB connectd");
  });
  await mongoose.connect(process.env.MONGODB_URI, {dbName: "ecommerce"});
};

export default connectDB;
