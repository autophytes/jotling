import React, { useMemo } from 'react';

const FindResultLine = ({
	result,
	isCurrentResult,
	width: preTextChars,
	handleClick,
	currentResultRef,
}) => {
	// Calculate how much text to show before the keyword
	const preText = useMemo(() => {
		// if we hit the beginning, adjust the start to 0 to use all characters (like punctuation)

		// We're looking back 1 character for every rem of width
		const text = result.preText;
		let start = text.length;

		// Return the full text
		if (preTextChars >= text.length) {
			return text;
		}

		for (let i = 1; i <= preTextChars; i++) {
			const adjStart = Math.max(text.length - i, 0);
			const char = text.slice(adjStart, adjStart + 1);

			if (char === ' ') {
				start = adjStart + 1;
			}
		}

		return text.slice(start, text.length);
	}, [result, preTextChars]);

	return (
		<button
			className={
				'project-find-result file-nav document' + (isCurrentResult ? ' current-result' : '')
			}
			style={{ textOverflow: 'hidden' }}
			onClick={handleClick}
			ref={isCurrentResult ? currentResultRef : null}>
			<span>{preText}</span>
			<span style={{ backgroundColor: 'yellow' }}>{result.text}</span>
			<span>{result.postText}</span>
		</button>
	);
};

export default FindResultLine;
