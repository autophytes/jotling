export class LinkSelectionRangeRef {
	constructor() {
		// this.updateRect();

		console.log('LinkSelection constructor running');

		const update = (e) => {
			console.log('updating the selection range');
			let selection = document.getSelection();
			console.log('selection: ', selection);

			this.range = selection && selection.rangeCount && selection.getRangeAt(0);

			this.updateRect();
		};

		update();

		// We need to reposition upon scroll
		window.addEventListener('scroll', update);
		document.scrollingElement.addEventListener('scroll', update);
	}

	updateRect() {
		if (this.range) {
			console.log('setting properties via get bounding client rect');
			this.rect = this.range.getBoundingClientRect();
		} else {
			console.log('setting default properties');
			this.rect = {
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				width: 0,
				height: 0,
			};
		}

		this.rectChangedCallback(this.rect);
	}

	rectChangedCallback() {
		// Abstract to be implemented
	}

	getBoundingClientRect() {
		return this.rect;
	}

	get clientWidth() {
		return this.rect.width;
	}

	get clientHeight() {
		return this.rect.height;
	}
}
