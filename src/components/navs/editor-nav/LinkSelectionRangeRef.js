export class LinkSelectionRangeRef {
	constructor() {
		// this.updateRect();

		this.update = (e) => {
			if (!this.selection) {
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
			this.rect = {
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				width: 0,
				height: 0,
			};
		}
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
