/**
 * JWT Token Generator - 7-day expiry tokens
 */
import jwt from "jsonwebtoken";

const genToken = async (userId) => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    return token;
  } catch (error) {
    console.log(error);
  }
};

export default genToken;
