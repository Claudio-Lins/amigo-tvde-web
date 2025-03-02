const options = {
	// ...
	yaxis: {
		labels: {
			formatter: function (value: number) {
				return formatCurrency(value);
			},
		},
	},
	// ...
};
