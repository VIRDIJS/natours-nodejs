module.exports = (fn) => {
    // return anonymous function that express will call when the endpoint is accessed
    return (req, res, next) => {
      fn(req, res, next).catch(next);
    };
  };
