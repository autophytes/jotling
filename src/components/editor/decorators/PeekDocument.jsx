import React, { useEffect, useState, useContext, useLayoutEffect, useRef } from 'react';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import { generatePeekDecorator } from './PeekDocumentDecorators';

import CloseSVG from '../../../assets/svg/CloseSVG';

import { Editor, EditorState } from 'draft-js';

const PeekWindow = () => {
	const [documentName, setDocumentName] = useState('');
	const [editorState, setEditorState] = useState(EditorState.createEmpty());
	const [containerTop, setContainerTop] = useState(200);
	const [containerLeft, setContainerLeft] = useState(200);
	const [hasScrolled, setHasScrolled] = useState(false);

	const peekWindowContentRef = useRef(null);
	const peekWindowRef = useRef(null);

	const {
		editorArchives,
		linkStructureRef,
		peekWindowLinkId,
		setPeekWindowLinkId,
		navData,
		setNavData,
	} = useContext(LeftNavContext);

	// Reposition the peek window when dragging the title bar
	const handleResizeMouseDown = (e) => {
		const mouseX = e.clientX;
		const mouseY = e.clientY;
		console.log('mouse resizing');
		// setIsResizing(true);
		// let rootSize = Number(
		// 	window
		// 		.getComputedStyle(document.querySelector(':root'))
		// 		.getPropertyValue('font-size')
		// 		.replace('px', '')
		// );

		// let minWidth = 7 * rootSize;
		// let maxWidth = 25 * rootSize;
		// let widthOffset = rootSize / 4;

		// When the mouse moves, update the width to reflext the mouse's X coordinate
		const handleResizeMouseMove = (e) => {
			if (e.clientX !== 0) {
				const newX = containerLeft + (e.clientX - mouseX);
				const newY = Math.max(containerTop + (e.clientY - mouseY), 0);

				peekWindowRef.current.style.top = newY + 'px';
				peekWindowRef.current.style.left = newX + 'px';
			}
		};

		// When finshed resizing, set the width in REMs so it responds to root size changes
		const handleResizeMouseUp = (e) => {
			// setIsResizing(false);
			window.removeEventListener('mousemove', handleResizeMouseMove);
			window.removeEventListener('mouseup', handleResizeMouseUp);

			const newX = containerLeft + (e.clientX - mouseX);
			const newY = Math.max(containerTop + (e.clientY - mouseY), 0);

			setContainerTop(300);
			setContainerLeft(300);
		};

		window.addEventListener('mousemove', handleResizeMouseMove);
		window.addEventListener('mouseup', handleResizeMouseUp);
	};

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

			const windowRect = peekWindowContentRef.current.getBoundingClientRect();

			peekWindowContentRef.current.scrollTo({
				top: highlightRect.top - windowRect.top - 100,
				behavior: 'smooth',
			});
			setHasScrolled(true);
		}
	}, [editorState, hasScrolled]);

	return (
		<>
			<div
				className='peek-window'
				ref={peekWindowRef}
				style={{ top: `${containerTop}px`, left: `${containerLeft}px` }}>
				<div className='peek-window-top-handle' onMouseDown={handleResizeMouseDown}>
					<button
						className='peek-window-open'
						onClick={() => {
							setNavData({ ...navData, currentDoc: documentName });
							setPeekWindowLinkId(null);
						}}>
						Open Document
					</button>
					<p className='peek-window-title'>{documentName}</p>
					<button className='peek-window-close' onClick={() => setPeekWindowLinkId(null)}>
						<CloseSVG />
					</button>
				</div>
				<div className='peek-window-contents' ref={peekWindowContentRef}>
					<Editor editorState={editorState} readOnly />
				</div>
			</div>
		</>
	);
};

export default PeekWindow;
