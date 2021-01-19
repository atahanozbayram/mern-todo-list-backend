const errorMessageTemplates = {};

errorMessageTemplates.general = {};
errorMessageTemplates.authentication = {};

errorMessageTemplates.general.serverSideError = function (error) {
	if (!error) {
		return 'some error occured on server side.';
	}

	return error;
};

errorMessageTemplates.authentication.refreshTokenMissing = function () {
	return 'Refresh token is missing.';
};

module.exports = errorMessageTemplates;
