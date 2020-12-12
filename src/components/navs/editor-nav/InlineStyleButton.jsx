import React, { useContext } from 'react';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import { toggleInlineStyle } from '../../editor/editorStyleFunctions';

const InlineStyleButton = ({ children, currentStyles, style, removeStyle, injectStyle }) => {
	const { editorStateRef, setEditorStateRef } = useContext(LeftNavContext);

	// Checking if the removeStyle is on. If so, we'll toggle it off.
	// May need to change removeStyle to an array of styles to check if they're on (alignment).
	const styleToRemove = currentStyles.has(removeStyle) ? removeStyle : null;

	return (
		<button
			className={'nav-button' + (currentStyles.has(style) ? ' active' : '')}
			style={injectStyle ? injectStyle : {}}
			onMouseDown={(e) =>
				toggleInlineStyle(
					e,
					style,
					styleToRemove,
					editorStateRef.current,
					setEditorStateRef.current
				)
			}>
			{children}
		</button>
	);
};

export default InlineStyleButton;
