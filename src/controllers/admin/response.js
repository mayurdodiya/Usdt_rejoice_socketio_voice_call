const getMyCurrencyListRes = (response) => {
  return {
    totalRecords: response.totalRecords,
    currentPage: response.currentPage,
    totalPages: response.totalPages,
    pageSize: response.pageSize,
    data: response.data.map((item) => {
      return {
        ...item,
        currencyRates: {
          _id: item?.currencyRates[0]?._id,
          userId: item?.currencyRates[0]?.userId,
          buyRate: item?.currencyRates[0]?.buyRate,
          sellRate: item?.currencyRates[0]?.sellRate,
        },
      };
    }),
  };
};
const getCurrencyByIdRes = (response) => {
  return {
    ...response,
    currencyRates: {
      _id: response?.currencyRates[0]?._id,
      userId: response?.currencyRates[0]?.userId,
      buyRate: response?.currencyRates[0]?.buyRate,
      sellRate: response?.currencyRates[0]?.sellRate,
    },
  };
};

const getAgentListRes = (response) => {
  return {
    totalRecords: response.totalRecords,
    currentPage: response.currentPage,
    totalPages: response.totalPages,
    pageSize: response.pageSize,
    data: response.data.map((item) => {
      return {
        ...item._doc,
        currencies: item?.currencyRates?.length
          ? {
              _id: item?.currencyRates[0]?._id,
              userId: item?.currencyRates[0]?.userId,
              buyRate: item?.currencyRates[0]?.buyRate,
              sellRate: item?.currencyRates[0]?.sellRate,
            }
          : null,
      };
    }),
  };
};

module.exports = {
  getMyCurrencyListRes,
  getCurrencyByIdRes,
  getAgentListRes,
};
