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
	ContentState,
	CompositeDecorator,
	SelectionState,
	RichUtils,
	Modifier,
	getDefaultKeyBinding,
	KeyBindingUtil,
	convertToRaw,
	convertFromRaw,
	DefaultDraftBlockRenderMap,
} from 'draft-js';
import { setBlockData, getSelectedBlocksMetadata } from 'draftjs-utils';

import EditorNav from '../navs/editor-nav/EditorNav';

import { defaultText } from './defaultText';
import {
	spaceToAutoList,
	enterToUnindentList,
	doubleDashToLongDash,
} from './KeyBindFunctions';
import {
	defaultDecorator,
	generateDecoratorWithTagHighlights,
	updateLinkEntities,
	hasSelectionStartEntity,
	insertTextWithEntity,
} from './editorFunctions';
import { LinkDestBlock } from './decorators/LinkDecorators';
import { useDecorator } from './editorCustomHooks';
import { handleDraftImageDrop, ImageDecorator } from './decorators/ImageDecorator';

import EditorFindReplace from './EditorFindReplace';

var oneKeyStrokeAgo, twoKeyStrokesAgo;

const { hasCommandModifier } = KeyBindingUtil;

// I can add custom inline styles. { Keyword: CSS property }
const customStyleMap = {
	STRIKETHROUGH: {
		textDecoration: 'line-through',
	},
	SUBSCRIPT: {
		// LINE HEIGHT ISSUES. FIX LATER.
		verticalAlign: 'sub',
		fontSize: '60%',
	},
	SUPERSCRIPT: {
		// LINE HEIGHT ISSUES. FIX LATER.
		verticalAlign: 'super',
		fontSize: '60%',
	},
};

// Applies classes to certain blocks
const blockStyleFn = (block) => {
	// If the block data for a text-align property, add a class
	const blockData = block.getData();
	if (blockData) {
		let blockClass = '';

		const blockAlignment = blockData.get('text-align');
		if (blockAlignment) {
			blockClass = `${blockAlignment}-aligned-block`;
		}

		return blockClass;
	}

	return '';
};

//
//
// COMPONENT
const EditorContainer = ({ saveProject, setSaveProject }) => {
	// CONTEXT
	const {
		navData,
		setNavData,
		project,
		setProject,
		setLinkStructure,
		linkStructureRef,
		editorStateRef,
		editorStyles,
		editorArchives,
		setEditorArchives,
		setEditorStateRef,
		mediaStructure,
		setMediaStructure,
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

	// EDITOR STATE
	const [editorState, setEditorState] = useState(EditorState.createEmpty());
	// Updates the editorStateRef with the updated editorState
	useEffect(() => {
		editorStateRef.current = editorState;
	}, [editorState]);

	// STATE
	const [styleToRemove, setStyleToRemove] = useState('');
	const [spellCheck, setSpellCheck] = useState(false);
	const [style, setStyle] = useState({});
	const [currentStyles, setCurrentStyles] = useState(Immutable.Set());
	const [currentAlignment, setCurrentAlignment] = useState('');

	// QUEUES
	const [prev, setPrev] = useState({ doc: '', tempPath: '' });
	const [shouldResetScroll, setShouldResetScroll] = useState(false);

	// REFS
	const editorRef = useRef(null);

	// CUSTOM HOOKS
	const decorator = useDecorator(prev.doc, editorRef);
	// const decorator = useDecorator();

	// Focuses the editor on click
	const handleEditorWrapperClick = useCallback(
		(e) => {
			// If clicking inside the editor area but outside the
			//   actual draft-js editor, refocuses on the editor.
			if (['editor', 'editor-top-padding'].includes(e.target.className)) {
				editorRef.current.focus();
			} else if (e.target.className === 'editor-bottom-padding') {
				const newEditorState = EditorState.moveFocusToEnd(editorState);
				setEditorState(newEditorState);
			}
		},
		[editorRef, editorState]
	);

	const blockRendererFn = useCallback((contentBlock) => {
		const entityKey = contentBlock.getEntityAt(0);
		if (entityKey) {
			const contentState = editorStateRef.current.getCurrentContent();
			const entity = contentState.getEntity(entityKey);
			if (entity.get('type') === 'LINK-DEST') {
				return {
					component: LinkDestBlock,
					editable: true,
				};
			}
		}

		const imagesArray = contentBlock.getData().get('images', []);
		if (imagesArray.length) {
			return {
				component: ImageDecorator,
				editable: true,
			};
		}

		// At the end of this, if not rendering in a custom block, then check if images in the block
	}, []);

	// Make setEditorState available in the context
	useEffect(() => {
		setEditorStateRef.current = setEditorState;
	}, [setEditorState]);

	// Focus on load
	useEffect(() => {
		console.log('focus on load');
		editorRef.current.focus();
	}, [editorRef]);

	// Monitor the decorator for changes to update the editorState
	useEffect(() => {
		// Need to SET rather than createWithContent to maintain the undo/redo stack
		console.log('Updating the editor state with a new decorator');
		let newEditorState = EditorState.set(editorStateRef.current, {
			decorator: decorator,
		});

		setEditorState(newEditorState);
	}, [decorator]);

	// Handle shortcut keys. Using their default function right now.
	const customKeyBindingFn = (e) => {
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

	// Provides the additional editorState and setEditorState props to handleDrop
	const wrappedHandleDrop = (selection, dataTransfer, isInternal) => {
		return handleDraftImageDrop(
			selection,
			dataTransfer,
			isInternal,
			mediaStructure,
			setMediaStructure
		);
	};

	// Process the key presses
	const handleKeyCommand = useCallback((command, editorState) => {
		// First, handle commands that happen outside the editor (like saving)
		if (command === 'myeditor-save') {
			// Insert code to save the file
			return 'handled'; // Lets Draft know I've taken care of this one.
		}
		if (command === 'handled-in-binding-fn') {
			// For instance, I have to handle tab in the binding fn b/c it needs (e)
			// Otherwise, the browser tries to do things with the commands.
			return 'handled';
		}

		// If not custom handled, use the default handling
		const newState = RichUtils.handleKeyCommand(editorState, command);
		if (newState) {
			setEditorState(newState);
			console.log('handled in handleKeyCommand');
			return 'handled';
		}

		return 'not-handled'; // Lets Draft know to try to handle this itself.
	}, []);

	const handleBeforeInput = (char, editorState) => {
		const selection = editorState.getSelection();

		if (selection.isCollapsed()) {
			const contentState = editorState.getCurrentContent();
			const blockKey = selection.getStartKey();
			const block = contentState.getBlockForKey(blockKey);
			const blockLength = block.getLength();
			const start = Math.max(selection.getStartOffset() - 1, 0);

			// Ensure the character before has an entity
			// NOTE: may need to do start - 1 (min 0)
			let startEntityKey = null;
			if (blockLength) {
				startEntityKey = block.getEntityAt(start);
			} else {
				const prevBlock = contentState.getBlockBefore(blockKey);
				if (prevBlock) {
					startEntityKey = prevBlock.getEntityAt(prevBlock.getLength() - 1);
				}
			}
			if (startEntityKey === null) {
				return 'not-handled';
			}

			// Ensuring we're typing at the end of the block
			const selectionEnd = selection.getEndOffset();
			if (blockLength !== selectionEnd) {
				return 'not-handled';
			}

			// Ensure the entity is a link source or dest
			const entity = contentState.getEntity(startEntityKey);
			if (entity && !['LINK-SOURCE', 'LINK-DEST'].includes(entity.getType())) {
				return 'not-handled';
			}

			// Ensure the next block starts with the same entity
			const nextBlock = contentState.getBlockAfter(blockKey);
			if (nextBlock && nextBlock.getEntityAt(0) !== startEntityKey) {
				return 'not-handled';
			}

			const style = editorState.getCurrentInlineStyle();
			const newContent = Modifier.insertText(
				contentState,
				selection,
				char,
				style,
				startEntityKey
			);
			const newEditorState = EditorState.push(editorState, newContent, 'insert-characters');
			setEditorState(newEditorState);
			return 'handled';
		}

		return 'not-handled';
	};

	// I'll use this and the one below in my EditorNav buttons
	const toggleBlockType = useCallback((e, blockType) => {
		e.preventDefault();
		setEditorState(RichUtils.toggleBlockType(editorStateRef.current, blockType));
		// editorRef.current.focus();
	}, []);

	// I'll use this and the one above in my EditorNav buttons
	const toggleInlineStyle = useCallback((e, inlineStyle, removeStyle) => {
		!!e && e.preventDefault();
		setEditorState(RichUtils.toggleInlineStyle(editorStateRef.current, inlineStyle));

		// If there's a style being toggled off, queue it up for removal
		!!removeStyle && setStyleToRemove(removeStyle);
	}, []);

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

	const toggleBlockStyle = useCallback((e, blockStyle) => {
		e.preventDefault();

		// Gets the starting and ending cursor locations (keys)
		const anchorKey = editorStateRef.current.getSelection().getAnchorKey();
		const focusKey = editorStateRef.current.getSelection().getFocusKey();

		// Selects the ending block
		const focusBlock = editorStateRef.current.getCurrentContent().getBlockForKey(focusKey);

		// Create a new selection state to add our selection to
		const selectionState = SelectionState.createEmpty();
		const entireBlockSelectionState = selectionState.merge({
			anchorKey: anchorKey, // Starting position
			anchorOffset: 0, // How much to adjust from the starting position
			focusKey: focusKey, // Ending position
			focusOffset: focusBlock.getText().length, // How much to adjust from the ending position.
		});

		// Creates a new EditorState to style
		const newEditorState = EditorState.forceSelection(
			editorStateRef.current,
			entireBlockSelectionState
		);

		// Sets the editor state to our new
		setEditorState(RichUtils.toggleInlineStyle(newEditorState, blockStyle));
	}, []);

	// Handles Text Alignment
	const toggleTextAlign = useCallback((e, newAlignment, currentAlignment) => {
		e.preventDefault();

		if (currentAlignment !== newAlignment) {
			setEditorState(setBlockData(editorStateRef.current, { 'text-align': newAlignment }));
		} else {
			setEditorState(setBlockData(editorStateRef.current, { 'text-align': undefined }));
		}
	}, []);

	// Removes queued up styles to remove
	useEffect(() => {
		if (styleToRemove !== '') {
			toggleInlineStyle(null, styleToRemove);
			setStyleToRemove('');
		}
	}, [styleToRemove]);

	// Sets editor styles
	useEffect(() => {
		let newStyles = {};
		!!fontSettings.currentFont &&
			(newStyles['fontFamily'] = fontSettings.currentFont.toString());
		!!lineHeight && (newStyles['lineHeight'] = lineHeight + 'em');
		!!editorSettings.editorMaxWidth &&
			(newStyles['maxWidth'] = editorSettings.editorMaxWidth + 'rem');

		if (!!fontSize) {
			newStyles['fontSize'] = +fontSize;
		}

		setStyle(newStyles);
	}, [editorSettings, lineHeight, fontSize, fontSettings]);

	// Saves current document file
	const saveFile = useCallback(
		(docName = navData.currentDoc) => {
			const currentContent = editorStateRef.current.getCurrentContent();
			const rawContent = convertToRaw(currentContent);

			ipcRenderer.invoke(
				'save-single-document',
				project.tempPath, // Must be the root temp path, not a subfolder
				project.jotsPath,
				'docs/' + docName, // Saved in the docs folder
				rawContent
			);
		},
		[project.tempPath]
	);

	// Saves the current file and calls the main process to save the project
	const saveFileAndProject = useCallback(
		async (saveProject) => {
			const { command, options } = saveProject;
			const docName = navData.currentDoc;
			const currentContent = editorStateRef.current.getCurrentContent();
			const rawContent = convertToRaw(currentContent);
			console.log('editorContainer options: ', options);

			// Save the current document
			let response = await ipcRenderer.invoke(
				'save-single-document',
				project.tempPath, // Must be the root temp path, not a subfolder
				project.jotsPath,
				'docs/' + docName, // Saved in the docs folder
				rawContent
			);

			if (response) {
				if (command === 'save-as') {
					// Leave the jotsPath argument blank to indicate a Save As
					let { tempPath, jotsPath } = await ipcRenderer.invoke(
						'save-project',
						project.tempPath,
						'',
						options
					);
					// Save the updated path names
					setProject({ tempPath, jotsPath });
				} else {
					// Request a save, don't wait for a response
					ipcRenderer.invoke('save-project', project.tempPath, project.jotsPath, options);
				}
			}
		},
		[project, navData.currentDoc]
	);

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

			const loadedFile = await ipcRenderer.invoke(
				'read-single-document',
				project.tempPath,
				'docs/' + navData.currentDoc
			);

			const fileContents = loadedFile.fileContents;

			// If the file isn't empty
			if (!!fileContents && Object.keys(fileContents).length !== 0) {
				const newContentState = convertFromRaw(loadedFile.fileContents);
				const newEditorState = EditorState.createWithContent(newContentState, decorator);

				// Synchronizing links to this page
				const editorStateWithLinks = updateLinkEntities(
					newEditorState,
					linkStructureRef.current,
					navData.currentDoc
				);
				console.log('about to set editorState inside LOADFILE');
				setEditorState(editorStateWithLinks);
			} else {
				// Synchronizing links to this page
				const newEditorState = EditorState.createEmpty(decorator);
				const editorStateWithLinks = updateLinkEntities(
					newEditorState,
					linkStructureRef.current,
					navData.currentDoc
				);
				setEditorState(editorStateWithLinks);
			}
			setShouldResetScroll(true);
			setPrev({ doc: navData.currentDoc, tempPath: navData.currentTempPath });
			console.log('setting editorState inside LOADFILE');
			// editorRef.current.focus();
		};
		loadFileFromSave();
	}, [editorRef, navData, project.tempPath, updateLinkEntities, linkStructureRef, decorator]);

	// ISSUE
	// When switching between files, sometimes the original file gets overwritten with the new.
	// I think this is an editorArchives thing?
	// I should just totally disable the decorator for the time being and see if it still happens.

	// Loading the new current document
	useEffect(() => {
		if (navData.currentDoc !== prev.doc || navData.currentTempPath !== prev.tempPath) {
			// If the previous doc changed and we didn't open a new project, save.
			if (prev.doc !== '' && navData.currentTempPath === prev.tempPath) {
				saveFile(prev.doc); // PROBLEM: saving after we've loaded the new project
				// Archive the editorState
				setEditorArchives({
					...editorArchives,
					[prev.doc]: {
						editorState: editorStateRef.current,
						scrollY: window.scrollY,
					},
				});
			}
			// setNavData({ ...navData, reloadCurrentDoc: false });

			// Check for existing editorState and load from that if available
			if (editorArchives.hasOwnProperty(navData.currentDoc)) {
				const newEditorState = editorArchives[navData.currentDoc].editorState;
				console.log('navData.currentDoc:', navData.currentDoc);

				// TO-DO: Check for new links to add before setting the editor state
				const editorStateWithLinks = updateLinkEntities(
					newEditorState,
					linkStructureRef.current,
					navData.currentDoc
				);

				setEditorState(editorStateWithLinks);
				setShouldResetScroll(true);
				setPrev({ doc: navData.currentDoc, tempPath: navData.currentTempPath });
			} else {
				loadFile();
			}
		}
	}, [editorStateRef, editorRef, navData, setNavData, prev, loadFile, linkStructureRef]);

	// As we type, updates alignment/styles to pass down to the editorNav. We do it here
	// instead of there to prevent unnecessary renders.
	useEffect(() => {
		const newCurrentStyles = editorState.getCurrentInlineStyle();
		const newCurrentAlignment = getSelectedBlocksMetadata(editorState).get('text-align');

		if (!Immutable.is(newCurrentStyles, currentStyles)) {
			setCurrentStyles(newCurrentStyles);
		}

		if (newCurrentAlignment !== currentAlignment) {
			setCurrentAlignment(newCurrentAlignment);
		}
	}, [editorState, currentStyles, currentAlignment]);

	// Scroll to the previous position or to the top on document load
	useLayoutEffect(() => {
		if (shouldResetScroll) {
			if (editorArchives[navData.currentDoc] && editorArchives[navData.currentDoc].scrollY) {
				window.scrollTo(0, editorArchives[navData.currentDoc].scrollY);
				setShouldResetScroll(false);
			} else {
				window.scrollTo(0, 0);
				setShouldResetScroll(false);
			}
		}
	}, [navData, editorArchives, shouldResetScroll]);

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
						currentStyles,
						currentAlignment,
						toggleBlockType,
						toggleBlockStyle,
						toggleInlineStyle,
						toggleTextAlign,
						spellCheck,
						toggleSpellCheck,
						saveFile,
						loadFile,
						editorContainerRef,
					}}
				/>
				<div className='editor-top-padding' />
				<div
					ref={editorPaddingWrapperRef}
					style={{ padding: `0 ${editorSettings.editorPadding}rem` }}>
					<Editor
						editorState={editorState}
						onChange={setEditorState}
						ref={editorRef}
						keyBindingFn={customKeyBindingFn}
						handleKeyCommand={handleKeyCommand}
						handleBeforeInput={handleBeforeInput}
						handleDrop={wrappedHandleDrop}
						customStyleMap={customStyleMap}
						blockStyleFn={blockStyleFn}
						blockRendererFn={blockRendererFn}
						// blockRenderMap={blockRenderMap}
						// plugins={[inlineToolbarPlugin]}
						spellCheck={spellCheck}
						key={spellCheck} // Forces rerender. Hacky, needs to be replaced. But works well.
					/>
				</div>

				<div className='editor-bottom-padding' />
				{/* <InlineToolbar /> */}
				{showFindReplace && <EditorFindReplace {...{ editorRef }} />}
			</div>
		</main>
	);
};

export default EditorContainer;
