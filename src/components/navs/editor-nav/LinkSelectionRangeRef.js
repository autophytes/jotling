export class LinkSelectionRangeRef {
	constructor() {
		// this.updateRect();

		console.log('LinkSelection constructor running');

		this.update = (e) => {
			console.log('updating the referenceElement');
			if (!this.selection) {
				console.log('setting this.selection');
				this.selection = document.getSelection();
			}

			if (!this.range) {
				this.range =
					this.selection && this.selection.rangeCount && this.selection.getRangeAt(0);
			}

			this.updateRect();
		};

		this.update();

		// We need to reposition upon scroll
		// Managing scroll outside of this object so it removes on unmount.
	}

	update() {
		this.update();
	}

	updateRect() {
		if (this.range) {
			// console.log('setting properties via get bounding client rect');
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

	removeListener() {
		window.removeEventListener('scroll', this.update);
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
