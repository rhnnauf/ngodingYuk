const paginationAndQuery = (model, populateData) => async (req, res, next) => {
  const requestQuery = { ...req.query };

  // Fields to exclude
  const exFields = ['select', 'sort', 'page', 'limit'];

  exFields.forEach((e) => delete requestQuery[e]);

  let queryString = JSON.stringify(requestQuery);

  // Create the operators
  queryString = queryString.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  let query = model.find(JSON.parse(queryString));

  // If select fields exist in the request params
  if (req.query.select) {
    const fields = req.query.select.replace(',', ' ');
    query = query.select(fields);
  }

  // If sort fields exist in the request params
  if (req.query.sort) {
    const sortBy = req.query.sort.replace(',', ' ');
    query = query.sort(sortBy);
  } else {
    // Sort default by created_at
    query = query.sort({ createdAt: 'desc' }); // sort('-createdAt')
  }

  // Pagination => default first page & limit 10 data
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIdx = (page - 1) * limit;
  const endIdx = page * limit;
  const totalDoc = await model.countDocuments(JSON.parse(queryString));

  query = query.skip(startIdx).limit(limit);

  if (populateData) {
    query = query.populate(populateData);
  }

  // Find the resources
  const data = await query;

  // Pagination data
  const pagination = {};

  if (endIdx < totalDoc) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIdx > 0) {
    pagination.previous = {
      page: page - 1,
      limit,
    };
  }

  res.paginationAndQueryResults = {
    success: true,
    data,
    pagination,
    length: data.length,
  };

  next();
};

module.exports = paginationAndQuery;
