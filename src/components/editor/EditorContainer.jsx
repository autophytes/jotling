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
	Modifier,
	SelectionState,
} from 'draft-js';
import { getSelectedBlocksMetadata } from 'draftjs-utils';

import EditorNav from '../navs/editor-nav/EditorNav';

import { updateLinkEntities } from './editorFunctions';
import {
	spaceToAutoList,
	enterToUnindentList,
	doubleDashToLongDash,
	checkWikiSectionSplitBlock,
	checkCommandForUpdateWordCount,
	removeEndingNewline,
	continueMultiBlockLinkSource,
	handleSelectionChange,
	fetchCorrectSelection,
	manuallyHandleReplaceText,
	shouldSkipEditorState,
	updateQuoteInput,
} from './editorInputFunctions';
import {
	defaultCustomStyleMap,
	blockStyleFn,
	updateCustomStyleMap,
	blockRendererFn,
} from './editorStyleFunctions';
import { updateAllBlocks } from '../../utils/draftUtils';
import { convertSetterToRefSetter } from '../../utils/contextUtils';

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
		navDataRef,
		project,
		linkStructureRef,
		editorStateRef,
		editorStyles,
		editorArchivesRef,
		setEditorStateRef,
		mediaStructure,
		setMediaStructure,
		isImageSelectedRef,
		customStyles,
		saveFile,
		saveFileAndProject,
	} = useContext(LeftNavContext);
	const {
		showFindAll,
		showFindReplace,
		contextEditorRef: findContextEditorRef,
		queueFindAllUpdate,
	} = useContext(FindReplaceContext);
	const {
		editorPaddingWrapperRef,
		editorContainerRef,
		editorSettings,
		lineHeight,
		fontSize,
		fontSettings,
	} = useContext(SettingsContext);
	const { finalizeDocWordCount, initializeDocWordCount, updateWordCount } = useContext(
		StatsContext
	);

	// EDITOR STATE
	const [editorState, setEditorStateOrig] = useState(EditorState.createEmpty());
	// Updates the editorStateRef with the updated editorState
	// useEffect(() => {
	// 	editorStateRef.current = editorState;
	// }, [editorState]);

	const setEditorState = useCallback((value) => {
		// console.log('setEditorState is being called');
		convertSetterToRefSetter(editorStateRef, setEditorStateOrig, value);
	}, []);

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
	const waitForSelectionRef = useRef(false);
	const waitForSelectionTimeoutRef = useRef(null);

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

	// Disable updates during text selection
	useEffect(() => {
		document.addEventListener('selectstart', () => {
			clearTimeout(waitForSelectionTimeoutRef.current);

			waitForSelectionRef.current = true;

			// Fallback to re-enable updates
			waitForSelectionTimeoutRef.current = setTimeout(() => {
				if (waitForSelectionRef.current === true) {
					console.log('timeout was needed to clear the waitForSelectionRef.current');
				}
				waitForSelectionRef.current = false;
			}, 2000);
		});
	}, []);

	// Sets the editorState
	const handleEditorStateChange = (editorState) => {
		// console.log('handleEditorStateChange');

		// Re-enable editorState updates again (disabled from selection)
		if (waitForSelectionRef.current) {
			waitForSelectionRef.current = false;
		}

		// Tell the FindAll component to re-search the currentDoc
		if (showFindAll) {
			queueFindAllUpdate();
		}

		// Cleans up selectionState before setting the editorState
		setEditorState(removeEndingNewline(editorState));
	};

	// Synchronize the editorRef to the contextEditorRef
	useEffect(() => {
		findContextEditorRef.current = editorRef;
	}, []);

	// Run on initial load
	useEffect(() => {
		// Make setEditorState available in the context
		setEditorStateRef.current = setEditorState;

		// Focus on the editor
		editorRef.current.focus();
	}, []);

	// // Registers a listener for selection changes
	// useEffect(() => {
	// 	const wrappedHandleSelectionChange = (e) => handleSelectionChange(e, editorRef);

	// 	document.addEventListener('selectionchange', wrappedHandleSelectionChange);
	// 	return () => document.removeEventListener('selectionchange', wrappedHandleSelectionChange);
	// }, []);

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
	const handleKeyCommand = (command, origEditorState) => {
		console.log('command:', command);

		// If the text selection hasn't settled yet (touchpad issues), skip changes
		if (waitForSelectionRef.current) {
			console.log('skipping keyCommand - waiting for selection');
			return 'handled';
		}

		if (command === 'handled-in-binding-fn') {
			// For instance, I have to handle tab in the binding fn b/c it needs (e)
			// Otherwise, the browser tries to do things with the commands.
			return 'handled';
		}

		// Use the DOM selection if necessary
		const editorState = fetchCorrectSelection(origEditorState, editorRef);

		// Check if we need to update the word count. If so, pass through the update option.
		const updateWordCountOption = checkCommandForUpdateWordCount(command);
		if (updateWordCountOption) {
			console.log('calling updateWordCount with command: ', updateWordCountOption);
			setTimeout(() =>
				updateWordCount(
					editorStateRef,
					editorState,
					navDataRef.current.currentDoc,
					updateWordCountOption
				)
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

			// *** Manually handling split block - break into separate function
			const selection = editorState.getSelection();
			let newContentState = Modifier.splitBlock(editorState.getCurrentContent(), selection);

			// Select the final cursor position
			const newBlockKey = newContentState.getBlockAfter(selection.getStartKey()).getKey();
			const emptySelectionState = SelectionState.createEmpty();
			const finalSelection = emptySelectionState.merge({
				anchorKey: newBlockKey,
				anchorOffset: 0,
				focusKey: newBlockKey,
				focusOffset: 0,
			});

			// Push the block changes to the editorState
			const editorStateBeforeSelect = EditorState.push(
				editorState,
				newContentState,
				'split-block'
			);

			// Force the final selection
			setEditorState(EditorState.forceSelection(editorStateBeforeSelect, finalSelection));
			return 'handled';
			// Going to have to deal with the link stuff differently (they're entities)
		}

		// If not custom handled, use the default handling
		// NOTE: RichUtils only handles backspace/delete if collapsed selection
		let newEditorState = RichUtils.handleKeyCommand(editorState, command);
		if (newEditorState) {
			console.log('handle key command handled it');
			setEditorState(newEditorState);
			return 'handled';
		}

		return 'not-handled'; // Lets Draft know to try to handle this itself.
	};

	const handleBeforeInput = (char, origEditorState) => {
		// If the text selection hasn't settled yet (touchpad issues), skip changes
		if (waitForSelectionRef.current) {
			console.log('skipping input - waiting for selection');
			return 'handled';
		}

		// Use the DOM selection if necessary
		const editorState = fetchCorrectSelection(origEditorState, editorRef);
		const selection = editorState.getSelection();

		// Substitute the quote character
		let shouldReplaceText = false;
		if (char === "'" || char === '"') {
			char = updateQuoteInput(editorState, char);
			shouldReplaceText = true;
		}

		// Update the word count after each space
		if (char === ' ') {
			console.log('getting ready to update word count');
			// Timeout to delay until after update.
			// Let's us use the selection before to check the updated editorState.
			setTimeout(() =>
				updateWordCount(editorStateRef, editorState, navDataRef.current.currentDoc)
			);
		}

		// If we're typing at the end of a line and inside a link, continue that link
		if (selection.isCollapsed()) {
			const didHandle = continueMultiBlockLinkSource(
				editorState,
				setEditorState,
				selection,
				char
			);
			if (didHandle === 'handled') {
				return 'handled';
			}
		}

		// Draft's selection is messed up on non-collapsed selections on some systems.
		// Handle inserting the input manually.
		// if (!selection.isCollapsed()) {
		// 	console.log('about to set the new editorState');
		// 	setEditorState(manuallyHandleReplaceText(editorState, char));

		// 	console.log('set the new editorState');
		// 	return 'handled';
		// }

		// Replace the character ourselves if needed
		if (shouldReplaceText) {
			const newEditorState = manuallyHandleReplaceText(editorState, char);
			setEditorState(newEditorState);
			return 'handled';
		}

		return 'not-handled';
	};

	// Return key handler - converts shift+return to soft new line
	const handleReturn = (e) => {
		if (e.shiftKey) {
			setEditorState(RichUtils.insertSoftNewline(editorState));
			return 'handled';
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
		if (customStyles) {
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
			initializeDocWordCount(editorStateWithLinks, navData.currentDoc);

			setResetScrollDoc(navData.currentDoc);
			console.log('Setting editorState inside loadFile.');
		};

		loadFileFromSave();
	}, [navData, project.tempPath, decorator]);

	// Loading the new current document
	useEffect(() => {
		if (navData.currentDoc !== prev.doc || navData.currentTempPath !== prev.tempPath) {
			// Ensure edits are allowed again
			waitForSelectionRef.current = false;

			// Update the session word count
			finalizeDocWordCount(editorStateRef.current, prev.doc);

			// If the previous doc changed and we didn't open a new project, save.
			if (prev.doc !== '' && navData.currentTempPath === prev.tempPath) {
				// PROBLEM: saving after we've loaded the new project
				saveFile(prev.doc, null, window.scrollY);
			}

			// Check for existing editorState and load from that if available
			if (editorArchivesRef.current.hasOwnProperty(navData.currentDoc)) {
				// Flag that we've updated the file
				setPrev({ doc: navData.currentDoc, tempPath: navData.currentTempPath });

				console.log(
					'editorArchivesRef.current[navData.currentDoc]:',
					editorArchivesRef.current[navData.currentDoc]
				);
				const newEditorState = editorArchivesRef.current[navData.currentDoc].editorState;

				// Decorator needs updated editorStateRef to update findRegisterRef
				editorStateRef.current = newEditorState;
				const editorStateWithDecorator = EditorState.set(newEditorState, {
					decorator: decorator,
				});

				// Check for new links to add before setting the editor state
				const editorStateWithLinks = updateLinkEntities(
					editorStateWithDecorator,
					linkStructureRef.current,
					navData.currentDoc
				);

				console.log('Setting editorState from editorArchives.');

				setEditorState(editorStateWithLinks);
				initializeDocWordCount(editorStateWithLinks, navData.currentDoc);
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
		decorator,
		saveFile,
		linkStructureRef,
	]);

	// As we type, updates alignment/styles/type to pass down to the editorNav. We do it here
	// instead of there to prevent unnecessary renders.
	useEffect(() => {
		// Async so it doesn't delay the Editor receiving the updated editorState
		const updateNavIconStates = async () => {
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
		};

		updateNavIconStates();
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
				paddingLeft: editorStyles.leftIsPinned
					? editorStyles[showFindAll ? 'leftNavFind' : 'leftNav'] + 'rem'
					: 0,
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

				<EditorHeader {...{ editorRef }} />

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
							handleReturn={handleReturn}
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
				{showFindReplace && <EditorFindReplace />}
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
