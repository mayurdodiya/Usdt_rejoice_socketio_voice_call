const getCurrencyDropdownRes = (response) => {
    return response.map((item) => {
        return {
            _id: item._id,
            currencyName: item.currencyName,
            logo: item.logo,
            isActive: item.isActive,
            // currencyRates: item.currencyRates[0],
        }
    })
};

module.exports = {
  getCurrencyDropdownRes,
};
