import React, { useMemo } from 'react';

const FindResultLine = ({ result, width: preTextChars, handleClick }) => {
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
			className='project-find-result file-nav document'
			style={{ textOverflow: 'hidden' }}
			onClick={handleClick}>
			<span>{preText}</span>
			<span style={{ backgroundColor: 'yellow' }}>{result.text}</span>
			<span>{result.postText}</span>
		</button>
	);
};

export default FindResultLine;
