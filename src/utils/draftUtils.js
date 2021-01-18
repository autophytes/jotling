// Return the selected plain text from the content state
export const getTextSelection = (contentState, selection, blockDelimiter = '\n') => {
	// blockDelimeter is used to join the text afterwards
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

// Force an update of all contentBlocks. Returns a new contentState.
export const updateAllBlocks = (editorState) => {
	const contentState = editorState.getCurrentContent();
	const blockMap = contentState.getBlockMap();

	const indented = blockMap.map((blk) => blk.set('depth', blk.getDepth() + 1));
	const outdented = indented.map((blk) => blk.set('depth', blk.getDepth() - 1));
	const outdentedContentState = contentState.set('blockMap', outdented);

	return outdentedContentState;
};

// Returns an array of the blockKeys in the selection
export const getBlockKeysForSelection = (editorState) => {
	const selection = editorState.getSelection();
	const startKey = selection.getStartKey();
	const endKey = selection.getEndKey();
	let keyArray = [startKey];

	// If start and end are the same, just return the start
	if (startKey === endKey) {
		return keyArray;
	}

	const contentState = editorState.getCurrentContent();
	let iterateKey = startKey;
	// Loop from the start until we find the endKey
	while (iterateKey !== endKey) {
		iterateKey = contentState.getKeyAfter(iterateKey);
		keyArray.push(iterateKey);
	}

	return keyArray;
};

// Returns an array of all blockKeys in the contentState
export const getAllBlockKeys = (contentState) => {
	const blockArray = contentState.getBlocksAsArray();
	return blockArray.map((item) => item.getKey());
};

// Build an array of block keys and text
export const getBlockPlainTextArray = (editorState) => {
	const currentContent = editorState.getCurrentContent();
	const draftBlockArray = currentContent.getBlocksAsArray();
	const filteredArray = draftBlockArray.filter((block) => block.getType !== 'wiki-section');

	return filteredArray.map((block) => ({
		key: block.getKey(),
		text: block.getText(),
	}));
};
