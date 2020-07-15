import React, { useState, useRef, useCallback, useEffect, useContext } from 'react';
import { getSelectedBlocksMetadata } from 'draftjs-utils';
import { ipcRenderer } from 'electron';
import Immutable from 'immutable';

import { LeftNavContext } from '../../contexts/leftNavContext';

import {
	Editor,
	EditorState,
	ContentState,
	SelectionState,
	RichUtils,
	Modifier,
	getDefaultKeyBinding,
	KeyBindingUtil,
	convertToRaw,
	convertFromRaw,
} from 'draft-js';
import { setBlockData } from 'draftjs-utils';

import EditorNav from '../navs/editor-nav/EditorNav';

import { defaultText } from './defaultText';
import {
	spaceToAutoList,
	enterToUnindentList,
	doubleDashToLongDash,
} from './KeyBindFunctions';
var oneKeyStrokeAgo, twoKeyStrokesAgo;

// import Immutable from 'immutable';a
// import Editor from 'draft-js-plugins-editor';
// import createInlineToolbarPlugin from 'draft-js-inline-toolbar-plugin';
// const inlineToolbarPlugin = createInlineToolbarPlugin();
// const { InlineToolbar } = inlineToolbarPlugin;
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
	const blockAlignment = block.getData() && block.getData().get('text-align');
	if (blockAlignment) {
		return `${blockAlignment}-aligned-block`;
	}
	return '';
};

//
//
// COMPONENT
const EditorContainer = ({ editorWidth, width, targetRef }) => {
	// STATE
	const [editorState, setEditorState] = useState(() =>
		EditorState.createWithContent(ContentState.createFromText(defaultText))
	);
	const [styleToRemove, setStyleToRemove] = useState('');
	const [spellCheck, setSpellCheck] = useState(false);

	const [currentFont, setCurrentFont] = useState('PT Sans');
	const [fontSize, setFontSize] = useState(24);
	const [lineHeight, setLineHeight] = useState(1.15);
	const [style, setStyle] = useState({});
	const [currentStyles, setCurrentStyles] = useState(Immutable.Set());
	const [currentAlignment, setCurrentAlignment] = useState('');

	const [prevDoc, setPrevDoc] = useState('');

	// REFS
	// const editorContainerRef = useRef(null);
	const editorRef = useRef(null);
	const editorStateRef = useRef();

	// CONTEXT
	const { navData } = useContext(LeftNavContext);

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

	// Focus on load
	useEffect(() => {
		console.log('focus on load');
		editorRef.current.focus();
	}, [editorRef]);

	// Handle shortcut keys. Using their default function right now.
	const customKeyBindingFn = (e) => {
		// Example custom key handling. ALways return the default if mine don't catch it.
		if (e.keyCode === 83 /* `S` key */ && hasCommandModifier(e)) {
			return 'myeditor-save'; // This is a custom command, which I would handle in "handleKeyCommand"
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

	// Process the key presses
	const handleKeyCommand = (command) => {
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
	};

	// I'll use this and the one below in my EditorNav buttons
	const toggleBlockType = (e, blockType) => {
		e.preventDefault();
		setEditorState(RichUtils.toggleBlockType(editorState, blockType));
		// editorRef.current.focus();
	};

	// I'll use this and the one above in my EditorNav buttons
	const toggleInlineStyle = (e, inlineStyle, removeStyle) => {
		!!e && e.preventDefault();
		setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));

		// If there's a style being toggled off, queue it up for removal
		!!removeStyle && setStyleToRemove(removeStyle);
	};

	// Toggle spellcheck. If turning it off, have to rerender the editor to remove the lines.
	const toggleSpellCheck = (e) => {
		e.preventDefault();
		if (spellCheck) {
			setSpellCheck(false);
			editorRef.current.forceUpdate();
		} else {
			setSpellCheck(true);
		}
	};

	const toggleBlockStyle = (e, blockStyle) => {
		e.preventDefault();

		// Gets the starting and ending cursor locations (keys)
		const anchorKey = editorState.getSelection().getAnchorKey();
		const focusKey = editorState.getSelection().getFocusKey();

		// Selects the ending block
		const focusBlock = editorState.getCurrentContent().getBlockForKey(focusKey);

		// Create a new selection state to add our selection to
		const selectionState = SelectionState.createEmpty();
		const entireBlockSelectionState = selectionState.merge({
			anchorKey: anchorKey, // Starting position
			anchorOffset: 0, // How much to adjust from the starting position
			focusKey: focusKey, // Ending position
			focusOffset: focusBlock.getText().length, // How much to adjust from the ending position.
		});

		// Creates a new EditorState to style
		const newEditorState = EditorState.forceSelection(editorState, entireBlockSelectionState);

		// Sets the editor state to our new
		setEditorState(RichUtils.toggleInlineStyle(newEditorState, blockStyle));
	};

	// Handles Text Alignment
	const toggleTextAlign = (e, newAlignment, currentAlignment) => {
		e.preventDefault();

		if (currentAlignment !== newAlignment) {
			setEditorState(setBlockData(editorState, { 'text-align': newAlignment }));
		} else {
			setEditorState(setBlockData(editorState, { 'text-align': undefined }));
		}
	};

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
		!!currentFont && (newStyles['fontFamily'] = currentFont.toString());
		!!lineHeight && (newStyles['lineHeight'] = lineHeight + 'em');
		if (!!fontSize) {
			newStyles['fontSize'] = +fontSize;
		}

		setStyle(newStyles);
	}, [currentFont, fontSize, lineHeight]);

	// Saves current file
	const saveFile = (docName = navData.currentDoc) => {
		const currentContent = editorState.getCurrentContent();
		const rawContent = convertToRaw(currentContent);

		const sendFileToSave = async () => {
			const newFileName = await ipcRenderer.invoke(
				'save-single-document',
				'Jotling/' + navData.currentProj,
				docName,
				rawContent
			);
		};
		sendFileToSave();
	};

	// Loads current file
	const loadFile = useCallback(() => {
		const loadFileFromSave = async () => {
			console.log('Jotling/' + navData.currentProj);

			const loadedFile = await ipcRenderer.invoke(
				'read-single-document',
				'Jotling/' + navData.currentProj,
				navData.currentDoc
			);

			const fileContents = loadedFile.fileContents;
			console.log(fileContents);

			// If the file isn't empty (potentially meaning it)
			if (!!fileContents && Object.keys(fileContents).length !== 0) {
				const newContentState = convertFromRaw(loadedFile.fileContents);
				const newEditorState = EditorState.createWithContent(newContentState);
				setEditorState(newEditorState);
			} else {
				setEditorState(EditorState.createEmpty());
			}
		};
		loadFileFromSave();
	}, [navData]);

	// Loading the new current document
	useEffect(() => {
		if (navData.currentDoc !== prevDoc) {
			if (prevDoc !== '') {
				saveFile(prevDoc);
			}
			setPrevDoc(navData.currentDoc);
			console.log('loading the new currentDoc');
			loadFile();
		}
	}, [navData.currentDoc, prevDoc, setPrevDoc, loadFile]);

	// As we type, updates alignment/styles to pass down to the editorNav. We do it here
	// instead of there to prevent unnecessary renders.
	useEffect(() => {
		const newCurrentStyles = editorState.getCurrentInlineStyle();
		const newCurrentAlignment = getSelectedBlocksMetadata(editorState).get('text-align');

		if (!Immutable.is(newCurrentStyles, currentStyles)) {
			console.log('new current styles');
			setCurrentStyles(newCurrentStyles);
		}

		if (newCurrentAlignment !== currentAlignment) {
			console.log('new current alignment');
			setCurrentAlignment(newCurrentAlignment);
		}
	}, [editorState, currentStyles, currentAlignment]);

	// useEffect(() => {
	// 	console.log(editorContainerRef.current.offsetWidth);
	// }, [editorContainerRef.current]);

	return (
		<main
			className='editor-area'
			style={{
				paddingLeft: editorWidth.leftIsPinned ? editorWidth.leftNav + 'rem' : 0,
				paddingRight: editorWidth.rightIsPinned ? editorWidth.rightNav + 'rem' : 0,
			}}
			// ref={targetRef}
		>
			<EditorNav
				editorWidth={editorWidth}
				// editorState={editorState}
				currentStyles={currentStyles}
				currentAlignment={currentAlignment}
				toggleBlockType={toggleBlockType}
				toggleBlockStyle={toggleBlockStyle}
				toggleInlineStyle={toggleInlineStyle}
				toggleTextAlign={toggleTextAlign}
				spellCheck={spellCheck}
				toggleSpellCheck={toggleSpellCheck}
				currentFont={currentFont}
				setCurrentFont={setCurrentFont}
				fontSize={fontSize}
				setFontSize={setFontSize}
				lineHeight={lineHeight}
				setLineHeight={setLineHeight}
				saveFile={saveFile}
				loadFile={loadFile}
			/>

			<div className='editor' onClick={handleEditorWrapperClick} style={style}>
				<div className='editor-top-padding' />
				<Editor
					editorState={editorState}
					onChange={setEditorState}
					ref={editorRef}
					keyBindingFn={customKeyBindingFn}
					handleKeyCommand={handleKeyCommand}
					customStyleMap={customStyleMap}
					blockStyleFn={blockStyleFn}
					// blockRenderMap={blockRenderMap}
					// plugins={[inlineToolbarPlugin]}
					spellCheck={spellCheck}
					key={spellCheck} // Forces rerender. Hacky, needs to be replaced. But works well.
				/>
				<div className='editor-bottom-padding' />
				{/* <InlineToolbar /> */}
			</div>
		</main>
	);
};

export default EditorContainer;
