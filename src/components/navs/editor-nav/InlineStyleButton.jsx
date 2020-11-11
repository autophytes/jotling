import React from 'react';

const InlineStyleButton = ({
	children,
	toggleFn,
	currentStyles,
	style,
	removeStyle,
	injectStyle,
}) => {
	// Checking if the removeStyle is on. If so, we'll toggle it off.
	// May need to change removeStyle to an array of styles to check if they're on (alignment).
	const styleToRemove = currentStyles.has(removeStyle) ? removeStyle : null;

	return (
		<button
			className={'nav-button' + (currentStyles.has(style) ? ' active' : '')}
			style={injectStyle ? injectStyle : {}}
			onMouseDown={(e) => toggleFn(e, style, styleToRemove)}>
			{children}
		</button>
	);
};

export default InlineStyleButton;
