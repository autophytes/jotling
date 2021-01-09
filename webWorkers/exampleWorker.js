self.onmessage = (e) => {
	console.time('webWorker preloading: ');

	if (e.data) {
		console.log('webWorker e.data:', e.data);

		// Do the work in here, and self.postMessage the data you want to send back

		self.postMessage(newEditorArchives);
	}

	self.postMessage('No data');
};

export default self;
