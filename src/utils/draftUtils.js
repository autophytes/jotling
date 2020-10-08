// Return the selected plain text from the content state
export const getTextSelection = (contentState, selection, blockDelimiter) => {
	blockDelimiter = blockDelimiter || '\n'; // Used to join the text afterwards
	var startKey = selection.getStartKey();
	var endKey = selection.getEndKey();
	var blocks = contentState.getBlockMap();

	// Grab all blocks that encompass our selection
	var lastWasEnd = false;
	var selectedBlock = blocks
		// Don't start grabbing until we find our starting block
		.skipUntil((block) => {
			return block.getKey() === startKey;
		})
		// Grab until we find the ending block, then grab 1 more (so it includes the ending block)
		.takeUntil((block) => {
			var result = lastWasEnd;

			if (block.getKey() === endKey) {
				lastWasEnd = true;
			}

			return result;
		});

	// Returning a joined array of the blocks text - just the paragraphs of text
	let selectedText = selectedBlock
		.map((block) => {
			var key = block.getKey();
			var text = block.getText();

			var start = 0;
			var end = text.length;

			// Ensures we don't grab text before/after the selection in a block
			if (key === startKey) {
				start = selection.getStartOffset();
			}
			if (key === endKey) {
				end = selection.getEndOffset();
			}

			text = text.slice(start, end);
			return text;
		})
		.join(blockDelimiter);

	let cleanedSelectedText =
		selectedText.slice(-1) === '\n' ? selectedText.slice(0, -1) : selectedText;

	return cleanedSelectedText;
};
