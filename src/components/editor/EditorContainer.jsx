import React, {
	useState,
	useRef,
	useCallback,
	useEffect,
	useContext,
	useLayoutEffect,
} from 'react';
import { ipcRenderer } from 'electron';
import Immutable from 'immutable';

import { LeftNavContext } from '../../contexts/leftNavContext';
import { FindReplaceContext } from '../../contexts/findReplaceContext';
import { SettingsContext } from '../../contexts/settingsContext';

import {
	Editor,
	EditorState,
	RichUtils,
	getDefaultKeyBinding,
	convertFromRaw,
} from 'draft-js';
import { getSelectedBlocksMetadata } from 'draftjs-utils';

import EditorNav from '../navs/editor-nav/EditorNav';

import { updateLinkEntities, updateWordCount } from './editorFunctions';
import {
	spaceToAutoList,
	enterToUnindentList,
	doubleDashToLongDash,
	checkWikiSectionSplitBlock,
	checkCommandForUpdateWordCount,
	removeEndingNewline,
	continueMultiBlockLinkSource,
} from './editorInputFunctions';
import {
	defaultCustomStyleMap,
	blockStyleFn,
	updateCustomStyleMap,
	blockRendererFn,
} from './editorStyleFunctions';
import { updateAllBlocks } from '../../utils/draftUtils';

import { useDecorator } from './editorCustomHooks';
import { handleDraftImageDrop } from './editorComponents/BlockImageContainer';

import EditorFindReplace from './EditorFindReplace';
import { StatsContext } from '../../contexts/statsContext';
import EditorHeader from '../editorHeader/EditorHeader';
import DecoratorContextProvider from '../../contexts/decoratorContext';

const EditorContainer = ({ saveProject, setSaveProject }) => {
	// CONTEXT
	const {
		navData,
		setNavData,
		project,
		linkStructureRef,
		editorStateRef,
		editorStyles,
		editorArchivesRef,
		setEditorArchives,
		setEditorStateRef,
		mediaStructure,
		setMediaStructure,
		isImageSelectedRef,
		customStyles,
		saveFile,
		saveFileAndProject,
	} = useContext(LeftNavContext);
	const { showFindReplace } = useContext(FindReplaceContext);
	const {
		editorPaddingWrapperRef,
		editorContainerRef,
		editorSettings,
		lineHeight,
		fontSize,
		fontSettings,
	} = useContext(SettingsContext);
	const { setDocWordCountObj, finalizeDocWordCount, initializeDocWordCount } = useContext(
		StatsContext
	);

	// EDITOR STATE
	const [editorState, setEditorState] = useState(EditorState.createEmpty());
	// Updates the editorStateRef with the updated editorState
	useEffect(() => {
		editorStateRef.current = editorState;
	}, [editorState]);

	// STATE
	const [spellCheck, setSpellCheck] = useState(false);
	const [style, setStyle] = useState({});
	const [customStyleMap, setCustomStyleMap] = useState(null);

	// QUEUES
	const [prev, setPrev] = useState({ doc: '', tempPath: '' });
	const [resetScrollDoc, setResetScrollDoc] = useState(false);

	// REFS
	const editorRef = useRef(null);
	const navSettersRef = useRef(null);

	// CUSTOM HOOKS
	const decorator = useDecorator(prev.doc, setEditorState);
	// const decorator = useDecorator();

	// Focuses the editor on click
	const handleEditorWrapperClick = useCallback((e) => {
		// If clicking inside the editor area but outside the
		//   actual draft-js editor, refocuses on the editor.
		if (['editor', 'editor-top-padding'].includes(e.target.className)) {
			editorRef.current.focus();
		} else if (e.target.className === 'editor-bottom-padding') {
			setEditorState((prev) => EditorState.moveFocusToEnd(prev));
		}
	}, []);

	// Sets the editorState
	const handleEditorStateChange = (editorState) => {
		// Cleans up selectionState before setting the editorState
		setEditorState(removeEndingNewline(editorState));
	};

	// Run on initial load
	useEffect(() => {
		// Make setEditorState available in the context
		setEditorStateRef.current = setEditorState;

		// Focus on the editor
		editorRef.current.focus();
	}, []);

	// Handle shortcut keys. Using their default function right now.
	const wrappedCustomKeyBindingFn = (e) => {
		return customKeyBindingFn(e, editorStateRef, setEditorState, isImageSelectedRef);
	};

	// Provides the additional editorState and setEditorState props to handleDrop
	const wrappedHandleDrop = useCallback(
		(selection, dataTransfer, isInternal) => {
			return handleDraftImageDrop(
				selection,
				dataTransfer,
				isInternal,
				mediaStructure,
				setMediaStructure,
				editorStateRef
			);
		},
		[mediaStructure]
	);

	// Process the key presses
	const handleKeyCommand = useCallback((command, editorState) => {
		if (command === 'handled-in-binding-fn') {
			// For instance, I have to handle tab in the binding fn b/c it needs (e)
			// Otherwise, the browser tries to do things with the commands.
			return 'handled';
		}

		// Check if we need to update the word count. If so, pass through the update option.
		const updateWordCountOption = checkCommandForUpdateWordCount(command);
		if (updateWordCountOption) {
			// console.log('calling updateWordCount with command: ', updateWordCountOption);
			setTimeout(() =>
				updateWordCount(editorStateRef, editorState, setDocWordCountObj, updateWordCountOption)
			);
			// Note that this isn't "handling" the command, just scheduling a background update.
		}

		// Handle split-block's manually IF the start/end of a custom block type
		if (command === 'split-block') {
			const newEditorState = checkWikiSectionSplitBlock(editorState);
			if (newEditorState) {
				console.log('handled with wikiSectionSplitBlock');
				setEditorState(newEditorState);
				return 'handled';
			}

			// Going to have to deal with the link stuff differently (they're entities)
		}

		// If not custom handled, use the default handling
		const newEditorState = RichUtils.handleKeyCommand(editorState, command);
		if (newEditorState) {
			console.log('handle key command handled it');
			setEditorState(newEditorState);
			// console.log('handled in handleKeyCommand');
			return 'handled';
		}

		return 'not-handled'; // Lets Draft know to try to handle this itself.
	}, []);

	const handleBeforeInput = (char, editorState) => {
		const selection = editorState.getSelection();

		// Update the word count after each space
		if (char === ' ') {
			// Timeout to delay until after update.
			// Let's us use the selection before to check the updated editorState.
			setTimeout(() => updateWordCount(editorStateRef, editorState, setDocWordCountObj));
		}

		// If we're typing at the end of a line and inside a link, continue that link
		if (selection.isCollapsed()) {
			const didHandle = continueMultiBlockLinkSource(editorState, selection, char);
			if (didHandle === 'handled') {
				return 'handled';
			}
		}

		return 'not-handled';
	};

	// Toggle spellcheck. If turning it off, have to rerender the editor to remove the lines.
	const toggleSpellCheck = useCallback(
		(e) => {
			e.preventDefault();
			if (spellCheck) {
				setSpellCheck(false);
				editorRef.current.forceUpdate();
			} else {
				setSpellCheck(true);
			}
		},
		[spellCheck]
	);

	// Sets editor styles
	useEffect(() => {
		let newStyles = {};

		if (!!fontSettings.currentFont) {
			newStyles['fontFamily'] = fontSettings.currentFont.toString();
		}

		if (!!lineHeight) {
			newStyles['lineHeight'] = lineHeight + 'em';
		}

		if (!!editorSettings.editorMaxWidth) {
			newStyles['maxWidth'] = editorSettings.editorMaxWidth + 'rem';
		}

		if (!!fontSize) {
			newStyles['fontSize'] = +fontSize;
		}

		setStyle(newStyles);
	}, [editorSettings, lineHeight, fontSize, fontSettings]);

	// Updates the customStyleMap
	useEffect(() => {
		console.log('customStyles changed');
		if (customStyles) {
			console.log('updating the style map');
			setCustomStyleMap(updateCustomStyleMap(customStyles));
			editorRef.current.forceUpdate();
		}
	}, [customStyles]);

	// Forces all blocks to update with the updated customStyleMap
	useEffect(() => {
		setEditorState((prevEditorState) =>
			EditorState.set(prevEditorState, {
				currentContent: updateAllBlocks(prevEditorState),
			})
		);
	}, [customStyleMap]);

	// Monitors for needing to save the current file and then whole project
	useEffect(() => {
		if (Object.keys(saveProject).length) {
			saveFileAndProject(saveProject);
			setSaveProject({});
		}
	}, [saveProject, saveFileAndProject]);

	// Loads current file
	const loadFile = useCallback(() => {
		const loadFileFromSave = async () => {
			if (!navData.currentDoc) {
				console.log("There's no currentDoc to load. loadFile() aborted.");
				return;
			}

			// Flag that we've updated the file
			setPrev({ doc: navData.currentDoc, tempPath: navData.currentTempPath });

			// Load the file from the hard drive
			const loadedFile = await ipcRenderer.invoke(
				'read-single-document',
				project.tempPath,
				'docs/' + navData.currentDoc
			);
			const fileContents = loadedFile.fileContents;

			let newEditorState;
			// If the file isn't empty, load into editorState. Otherwise, create an empty editorState.
			if (fileContents && Object.keys(fileContents).length) {
				const newContentState = convertFromRaw(loadedFile.fileContents);
				newEditorState = EditorState.createWithContent(newContentState, decorator);
			} else {
				newEditorState = EditorState.createEmpty(decorator);
			}

			// Synchronizing links to this page
			const editorStateWithLinks = updateLinkEntities(
				newEditorState,
				linkStructureRef.current,
				navData.currentDoc
			);

			setEditorState(editorStateWithLinks);
			initializeDocWordCount(editorStateWithLinks);

			setResetScrollDoc(navData.currentDoc);
			console.log('Setting editorState inside loadFile.');
		};

		loadFileFromSave();
	}, [navData, project.tempPath, decorator]);

	// Loading the new current document
	useEffect(() => {
		if (navData.currentDoc !== prev.doc || navData.currentTempPath !== prev.tempPath) {
			// Update the session word count
			finalizeDocWordCount(editorStateRef.current);

			// If the previous doc changed and we didn't open a new project, save.
			if (prev.doc !== '' && navData.currentTempPath === prev.tempPath) {
				saveFile(prev.doc); // PROBLEM: saving after we've loaded the new project
				// Archive the editorState
				setEditorArchives((previous) => ({
					...previous,
					[prev.doc]: {
						editorState: editorStateRef.current,
						scrollY: window.scrollY,
					},
				}));
			}

			// Check for existing editorState and load from that if available
			if (editorArchivesRef.current.hasOwnProperty(navData.currentDoc)) {
				// Flag that we've updated the file
				setPrev({ doc: navData.currentDoc, tempPath: navData.currentTempPath });

				const newEditorState = editorArchivesRef.current[navData.currentDoc].editorState;
				console.log('navData.currentDoc:', navData.currentDoc);

				// TO-DO: Check for new links to add before setting the editor state
				const editorStateWithLinks = updateLinkEntities(
					newEditorState,
					linkStructureRef.current,
					navData.currentDoc
				);

				console.log('Setting editorState from editorArchives.');

				setEditorState(editorStateWithLinks);
				initializeDocWordCount(editorStateWithLinks);
				setResetScrollDoc(navData.currentDoc);
			} else {
				loadFile();
			}
		}
	}, [
		editorStateRef,
		editorRef,
		navData,
		setNavData,
		prev,
		loadFile,
		saveFile,
		linkStructureRef,
	]);

	// As we type, updates alignment/styles/type to pass down to the editorNav. We do it here
	// instead of there to prevent unnecessary renders.
	useEffect(() => {
		// Check that the setters are initialized
		if (!navSettersRef.current) {
			return;
		}

		const selectionState = editorState.getSelection();
		const currentBlockKey = selectionState.getStartKey();
		const block = editorState.getCurrentContent().getBlockForKey(currentBlockKey);

		const newCurrentBlockType = block.getType();
		const newCurrentStyles = editorState.getCurrentInlineStyle();
		const newCurrentAlignment = getSelectedBlocksMetadata(editorState).get('text-align');

		// Update the styles
		navSettersRef.current.setCurrentStyles((prev) => {
			if (!Immutable.is(newCurrentStyles, prev)) {
				return newCurrentStyles;
			} else {
				return prev;
			}
		});

		// Update the block type
		navSettersRef.current.setCurrentBlockType((prev) => {
			if (newCurrentBlockType !== prev) {
				return newCurrentBlockType;
			} else {
				return prev;
			}
		});

		// Update the text alignment
		navSettersRef.current.setCurrentAlignment((prev) => {
			if (newCurrentAlignment !== prev) {
				return newCurrentAlignment;
			} else {
				return prev;
			}
		});
	}, [editorState]);

	// When loading a new document, set the scroll position
	useLayoutEffect(() => {
		if (resetScrollDoc) {
			if (
				editorArchivesRef.current[resetScrollDoc] &&
				editorArchivesRef.current[resetScrollDoc].scrollY
			) {
				// If we have a previously scrolled position, restore the scroll
				window.scrollTo(0, editorArchivesRef.current[resetScrollDoc].scrollY);
				setResetScrollDoc(false);
			} else {
				// Otherwise, scroll to the top
				window.scrollTo(0, 0);
				setResetScrollDoc(false);
			}
		}
	}, [resetScrollDoc]);

	return (
		<main
			className='editor-area'
			style={{
				paddingLeft: editorStyles.leftIsPinned ? editorStyles.leftNav + 'rem' : 0,
				paddingRight: editorStyles.rightIsPinned ? editorStyles.rightNav + 'rem' : 0,
			}}>
			<div
				className='editor'
				onClick={handleEditorWrapperClick}
				style={style}
				ref={editorContainerRef}>
				{/* // HOVER HERE */}
				<EditorNav
					{...{
						navSettersRef,
						spellCheck,
						toggleSpellCheck,
						editorRef,
					}}
				/>

				<EditorHeader />

				<div
					ref={editorPaddingWrapperRef}
					style={{ padding: `0 ${editorSettings.editorPadding}rem` }}>
					<DecoratorContextProvider>
						<Editor
							editorState={editorState}
							onChange={handleEditorStateChange}
							ref={editorRef}
							keyBindingFn={wrappedCustomKeyBindingFn}
							handleKeyCommand={handleKeyCommand}
							handleBeforeInput={handleBeforeInput}
							handleDrop={wrappedHandleDrop}
							customStyleMap={customStyleMap ? customStyleMap : defaultCustomStyleMap}
							blockStyleFn={blockStyleFn}
							blockRendererFn={blockRendererFn}
							// blockRenderMap={extendedBlockRenderMap}
							// plugins={[inlineToolbarPlugin]}
							spellCheck={spellCheck}
							key={spellCheck} // Forces rerender. Hacky, needs to be replaced. But works well.
						/>
					</DecoratorContextProvider>
				</div>

				<div className='editor-bottom-padding' />
				{/* <InlineToolbar /> */}
				{showFindReplace && <EditorFindReplace {...{ editorRef }} />}
			</div>
		</main>
	);
};

export default EditorContainer;

var oneKeyStrokeAgo, twoKeyStrokesAgo;
const customKeyBindingFn = (e, editorStateRef, setEditorState, isImageSelectedRef) => {
	const editorState = editorStateRef.current;

	if (e.keyCode === 8 || e.keyCode === 46) {
		// Don't backspace/delete if image selected. We'll delete the image instead.
		if (isImageSelectedRef.current) {
			return 'handled-in-binding-fn';
		}
	}

	if (e.keyCode === 9 /* TAB */) {
		// NOTE: this just handles indenting list items, not indenting paragraphs.
		const newEditorState = RichUtils.onTab(e, editorState, 8);
		if (newEditorState !== editorState) {
			setEditorState(newEditorState);
		}
		twoKeyStrokesAgo = oneKeyStrokeAgo;
		oneKeyStrokeAgo = e.keyCode;
		return 'handled-in-binding-fn';
	}
	if (e.keyCode === 32 /* SPACE */) {
		// Auto-converts to lists
		let returnValue = spaceToAutoList(editorState, setEditorState);

		// If the two previous keystrokes were hyphens
		if (!returnValue && oneKeyStrokeAgo === 189 && twoKeyStrokesAgo === 189) {
			returnValue = doubleDashToLongDash(editorState, setEditorState);
		}

		if (returnValue) {
			twoKeyStrokesAgo = oneKeyStrokeAgo;
			oneKeyStrokeAgo = e.keyCode;
			return returnValue;
		}
	}
	if (e.keyCode === 13 /* ENTER */) {
		// Un-indents lists
		const returnValue = enterToUnindentList(editorState, setEditorState);

		if (returnValue) {
			twoKeyStrokesAgo = oneKeyStrokeAgo;
			oneKeyStrokeAgo = e.keyCode;
			return returnValue;
		}
	}

	twoKeyStrokesAgo = oneKeyStrokeAgo;
	oneKeyStrokeAgo = e.keyCode;
	return getDefaultKeyBinding(e);
};
