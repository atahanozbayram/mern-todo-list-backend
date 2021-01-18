const errorMessageTemplates = {};

errorMessageTemplates.general = {};
errorMessageTemplates.authentication = {};

errorMessageTemplates.general.serverSideError = function (error) {
	if (!error) {
		return 'error';
	}

	return 'Some error occured on server side.';
};

errorMessageTemplates.authentication.refreshTokenMissing = function () {
	return 'Refresh token is missing.';
};

module.exports = errorMessageTemplates;
