import React, {
	useEffect,
	useState,
	useContext,
	useLayoutEffect,
	useRef,
	useCallback,
} from 'react';

import { LeftNavContext } from '../../contexts/leftNavContext';

import ResizableWindow from '../containers/ResizableWindow';
import { generatePeekDecorator } from './editorComponents/PeekDocumentDecorators';
import { findTitleForGivenDocFileName } from '../../utils/utils';

import { Editor, EditorState } from 'draft-js';

const PeekDocument = () => {
	// STATE
	const [documentName, setDocumentName] = useState('');
	const [documentTitle, setDocumentTitle] = useState('');
	const [editorState, setEditorState] = useState(EditorState.createEmpty());
	const [hasScrolled, setHasScrolled] = useState(false);

	// REFS
	const peekWindowContentRef = useRef(null);

	// CONTEXT
	const {
		editorArchives,
		linkStructureRef,
		peekWindowLinkId,
		setPeekWindowLinkId,
		navData,
		setNavData,
		setScrollToLinkId,
		scrollToLinkIdRef,
		docStructure,
	} = useContext(LeftNavContext);

	// Setting the document name
	useEffect(() => {
		setDocumentName(linkStructureRef.current.links[peekWindowLinkId].source);
	}, [peekWindowLinkId, linkStructureRef]);

	// Retrieve the document title
	useEffect(() => {
		const docCategories = ['draft', 'research', 'pages'];

		for (let category of docCategories) {
			let potentialTitle = findTitleForGivenDocFileName(docStructure[category], documentName);
			if (potentialTitle) {
				setDocumentTitle(potentialTitle);
				return;
			}
		}

		setDocumentTitle('');
	}, [documentName, docStructure]);

	// Generate our editorState to view in the peek window
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

	// Scroll to our matching link
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

	const closeFn = useCallback(() => {
		setPeekWindowLinkId(null);
	}, []);

	return (
		<>
			<ResizableWindow
				windowTitle={documentTitle ? documentTitle : documentName}
				peekWindowContentRef={peekWindowContentRef}
				closeFn={closeFn}>
				<Editor editorState={editorState} readOnly style={{ paddingBottom: '3rem' }} />
				<br />
				<br />
				<br />
				<button
					className='show-hide-tags-button peek-window-floating-button'
					onClick={() => {
						setNavData({ ...navData, currentDoc: documentName });
						setScrollToLinkId(peekWindowLinkId);
						scrollToLinkIdRef.current = peekWindowLinkId;
						setPeekWindowLinkId(null);
					}}>
					Open Source
				</button>
			</ResizableWindow>
		</>
	);
};

export default PeekDocument;
