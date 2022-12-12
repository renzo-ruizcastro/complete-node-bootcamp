class APIQuery {
  constructor(query, reqQuery) {
    this.query = query;
    this.reqQuery = reqQuery;
    this.allowedQueryParams = [
      ['duration', 'difficulty', 'price'], // filtering
      'sort', // sorting
      'fields', // field limiting
      'page', // pagination
      'limit', // pagination
    ];
    this.allowedFilteringQueryOperations = ['gt', 'gte', 'lt', 'lte'];
  }

  init() {
    const params = Object.keys(this.reqQuery);
    if (params.length > 0) {
      const isValid = params.every((param) =>
        this.allowedQueryParams.flat().includes(param)
      );
      if (!isValid) throw new Error('Invalid query parameters');
      return this.findQ().sortQ().selectQ().limitQ().paginateQ();
    }
    this.query = this.query.find().sort('-createdAt').select('-__v');
    return this;
  }

  findQ() {
    const filteringQuery = {};
    Object.keys(this.reqQuery).forEach((param) => {
      if (this.allowedQueryParams[0].includes(param))
        filteringQuery[param] = this.reqQuery[param];
    });
    let queryStr = JSON.stringify(filteringQuery);
    const operatorsRegex = new RegExp(
      `\\b(${this.allowedFilteringQueryOperations.join('|')})\\b`,
      `g`
    );
    queryStr = queryStr.replace(operatorsRegex, (match) => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sortQ() {
    if (this.reqQuery.sort) {
      const sortBy = this.reqQuery.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  selectQ() {
    if (this.reqQuery.fields) {
      const fields = this.reqQuery.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  limitQ() {
    if (this.reqQuery.limit && !this.reqQuery.page) {
      if (!Number.isInteger(+this.reqQuery.limit) || +this.reqQuery.limit < 1)
        throw new Error('Limit must be an integer greater than 0');
      this.query = this.query.limit(+this.reqQuery.limit);
    }
    return this;
  }

  paginateQ() {
    if (this.reqQuery.page && this.reqQuery.limit) {
      if (
        !Number.isInteger(+this.reqQuery.page) ||
        !Number.isInteger(+this.reqQuery.limit) ||
        +this.reqQuery.page < 1 ||
        +this.reqQuery.limit < 1
      )
        throw new Error('Page and limit must be integers greater than 0');
      const skip = (+this.reqQuery.page - 1) * +this.reqQuery.limit;
      this.query = this.query.skip(skip).limit(+this.reqQuery.limit);
    }
    return this;
  }
}

module.exports = APIQuery;
