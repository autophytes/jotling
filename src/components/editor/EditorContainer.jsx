import React, { useState, useRef, useCallback, useEffect } from 'react';
import Immutable from 'immutable';
import { ipcRenderer } from 'electron';

import {
	EditorState,
	SelectionState,
	RichUtils,
	Modifier,
	getDefaultKeyBinding,
	KeyBindingUtil,
	convertToRaw,
} from 'draft-js';
import Editor from 'draft-js-plugins-editor';
import createInlineToolbarPlugin from 'draft-js-inline-toolbar-plugin';
import { setBlockData } from 'draftjs-utils';

import NavEditor from '../navs/nav-editor/NavEditor';

import { spaceToAutoList, enterToUnindentList } from './KeyBindFunctions';

const inlineToolbarPlugin = createInlineToolbarPlugin();
const { InlineToolbar } = inlineToolbarPlugin;
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
	'RIGHT-ALIGN': {
		textAlign: 'right',
		display: 'inline-block',
	},
};

//
//
// COMPONENT
const EditorContainer = () => {
	const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
	const [styleToRemove, setStyleToRemove] = useState('');
	const [spellCheck, setSpellCheck] = useState(false);
	const [fontList, setFontList] = useState([]);
	const [currentFont, setCurrentFont] = useState('PT Sans');
	const [fontSize, setFontSize] = useState(null);
	const [style, setStyle] = useState({});
	const editorRef = useRef(null);

	// Load available fonts
	useEffect(() => {
		ipcRenderer.on('font-list', function (e, fonts) {
			setFontList(fonts);
			console.log(fonts);
		});
		console.log('ipcRenderer useEffect triggered');
	}, [ipcRenderer, setFontList]);

	// Applies classes to certain blocks
	const blockStyleFn = (block) => {
		// If the block data for a text-align property, add a class
		const blockAlignment = block.getData() && block.getData().get('text-align');
		if (blockAlignment) {
			return `${blockAlignment}-aligned-block`;
		}
		return '';
	};

	// Focuses the editor on click
	const handleEditorWrapperClick = useCallback((e) => {
		// If clicking inside the editor area but outside the
		//   actual draft-js editor, refocuses on the editor.
		if (e.target.className === 'editor') {
			editorRef.current.focus();
			// console.log(
			// 	'Refocused on editor. Should only fire when clicking outside' +
			// 		'the editor component but inside the editor div.'
			// );
		}
	});

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
			return 'handled-in-binding-fn';
		}
		if (e.keyCode === 32 /* SPACE */) {
			// Auto-converts to lists
			const returnValue = spaceToAutoList(editorState, setEditorState);

			if (!!returnValue) {
				return returnValue;
			}
		}
		if (e.keyCode === 13 /* ENTER */) {
			// Un-indents lists
			const returnValue = enterToUnindentList(editorState, setEditorState);

			if (!!returnValue) {
				return returnValue;
			}
		}

		return getDefaultKeyBinding(e);
	};

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
			console.log(command);
			console.log('handled in handleKeyCommand');
			return 'handled';
		}

		return 'not-handled'; // Lets Draft know to try to handle this itself.
	};

	// I'll use this and the one below in my NavEditor buttons
	const toggleBlockType = (e, blockType) => {
		e.preventDefault();
		setEditorState(RichUtils.toggleBlockType(editorState, blockType));
		// editorRef.current.focus();
	};

	// I'll use this and the one above in my NavEditor buttons
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
		!isNaN(fontSize) && (newStyles['fontSize'] = currentFont.toString());

		setStyle(newStyles);
	}, [currentFont, fontSize]);

	return (
		<main className='editor-area'>
			<NavEditor
				editorState={editorState}
				toggleBlockType={toggleBlockType}
				toggleBlockStyle={toggleBlockStyle}
				toggleInlineStyle={toggleInlineStyle}
				toggleTextAlign={toggleTextAlign}
				spellCheck={spellCheck}
				toggleSpellCheck={toggleSpellCheck}
				currentFont={currentFont}
				setCurrentFont={setCurrentFont}
				fontList={fontList}
				fontSize={fontSize}
				setFontSize={setFontSize}
			/>

			<div className='editor' onClick={handleEditorWrapperClick} style={style}>
				{/* <button onClick={() => editorRef.current.focus()}>Focus</button> */}
				<Editor
					editorState={editorState}
					onChange={setEditorState}
					ref={editorRef}
					keyBindingFn={customKeyBindingFn}
					handleKeyCommand={handleKeyCommand}
					customStyleMap={customStyleMap}
					blockStyleFn={blockStyleFn}
					// blockRenderMap={blockRenderMap}
					plugins={[inlineToolbarPlugin]}
					spellCheck={spellCheck}
					key={spellCheck} // Forces rerender. Hacky, needs to be replaced. But works well.
				/>
				<InlineToolbar />
				{/* <h1 className='chapter-title' contentEditable='false'>
					Chapter 1
				</h1>
				<p>
					Szeth-son-son-Vallano, Truthless of Shinovar, wore white on the day he was to kill a
					king. The white clothing was a Parshendi tradition, foreign to him. But he did as his
					masters required and did not ask for an explanation.
				</p>
				<p>
					He sat in a large stone room, baked by enormous firepits that cast a garish light
					upon the revelers, causing beads of sweat to form on their skin as they danced, and
					drank, and yelled, and sang, and clapped. Some fell to the ground red-faced, the
					revelry too much for them, their stomachs proving to be inferior wineskins. They
					looked as if they were dead, at least until their friends carried them out of the
					feast hall to waiting beds.
				</p>
				<p>
					Szeth did not sway to the drums, drink the sapphire wine, or stand to dance. He sat
					on a bench at the back, a still servant in white robes. Few at the treaty-signing
					celebration noticed him. He was just a servant, and Shin were easy to ignore. Most
					out here in the East thought Szeth’s kind were docile and harmless. They were
					generally right.
				</p>
				<p>
					The drummers began a new rhythm. The beats shook Szeth like a quartet of thumping
					hearts, pumping waves of invisible blood through the room.
				</p>
				<p>
					Szeth’s masters—who were dismissed as savages by those in more civilized kingdoms—sat
					at their own tables. They were men with skin of black marbled with red. Parshendi,
					they were named—cousins to the more docile servant peoples known as parshmen in most
					of the world. An oddity. They did not call themselves Parshendi; this was the Alethi
					name for them. It meant, roughly, “parshmen who can think.” Neither side seemed to
					see that as an insult.
				</p>
				<p>
					The Parshendi had brought the musicians. At first, the Alethi lighteyes had been
					hesitant. To them, drums were base instruments of the common, darkeyed people. But
					wine was the great assassin of both tradition and propriety, and now the Alethi elite
					danced with abandon.
				</p>
				<p>
					Szeth stood and began to pick his way through the room. The revelry had lasted long;
					even the king had retired hours ago. But many still celebrated. As he walked, Szeth
					was forced to step around Dalinar Kholin—the king’s own brother—who slumped drunken
					at a small table. The aging but powerfully built man kept waving away those who tried
					to encourage him to bed. Where was Jasnah, the king’s daughter? Elhokar, the king’s
					son and heir, sat at the high table, ruling the feast in his father’s absence. He was
					in conversation with two men, a dark-skinned Azish man who had an odd patch of pale
					skin on his cheek and a thinner, Alethi-looking man who kept glancing over his
					shoulder.
				</p> */}
			</div>
		</main>
	);
};

export default EditorContainer;
