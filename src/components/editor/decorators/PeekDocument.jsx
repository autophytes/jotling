import React, { useEffect, useState, useContext, useLayoutEffect, useRef } from 'react';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import { generatePeekDecorator } from './PeekDocumentDecorators';

import { Editor, EditorState } from 'draft-js';

const PeekWindow = () => {
	const [documentName, setDocumentName] = useState('');
	const [editorState, setEditorState] = useState(EditorState.createEmpty());
	const [containerTop, setContainerTop] = useState(200);
	const [containerLeft, setContainerLeft] = useState(200);
	const [hasScrolled, setHasScrolled] = useState(false);

	const peekWindowRef = useRef(null);

	const { editorArchives, linkStructureRef, peekWindowLinkId } = useContext(LeftNavContext);

	useEffect(() => {
		setDocumentName(linkStructureRef.current.links[peekWindowLinkId].source);
	}, [peekWindowLinkId, linkStructureRef]);

	useEffect(() => {
		if (documentName && editorArchives[documentName]) {
			console.log(editorArchives[documentName]);

			const sourceEntityKey = linkStructureRef.current.links[peekWindowLinkId].sourceEntityKey;
			const decorator = generatePeekDecorator(sourceEntityKey);

			let newEditorState = EditorState.createWithContent(
				editorArchives[documentName].editorState.getCurrentContent(),
				decorator
			);
			setEditorState(newEditorState);
		}
	}, [documentName, editorArchives, peekWindowLinkId]);

	useLayoutEffect(() => {
		const firstPeekHighlightElement = document.querySelector(
			'.peek-window-highlight-decorator'
		);
		if (!hasScrolled && firstPeekHighlightElement) {
			const highlightRect = firstPeekHighlightElement.getBoundingClientRect();

			const windowRect = peekWindowRef.current.getBoundingClientRect();

			peekWindowRef.current.scrollTo({
				top: highlightRect.top - windowRect.top - 100,
				behavior: 'smooth',
			});
			setHasScrolled(true);
		}
	}, [editorState, hasScrolled]);

	return (
		<div
			className='peek-window'
			ref={peekWindowRef}
			style={{ top: `${containerTop}px`, left: `${containerLeft}px` }}>
			<Editor editorState={editorState} readOnly />
		</div>
	);
};

export default PeekWindow;
