import jwt from "jsonwebtoken";

// Never blocks the request. If a valid token is sent, req.userId is set; otherwise it is null (guest).
const optionalAuth = (req, res, next) => {
  const { token } = req.headers;
  req.userId = null;

  if (token) {
    try {
      req.userId = jwt.verify(token, process.env.JWT_SECRET).id;
    } catch (error) {
      req.userId = null;
    }
  }
  next();
};

export default optionalAuth;
