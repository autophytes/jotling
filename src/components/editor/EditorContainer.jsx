import React, { useState, useRef, useCallback } from 'react';
import {
	Editor,
	EditorState,
	RichUtils,
	getDefaultKeyBinding,
	KeyBindingUtil,
} from 'draft-js';

import NavEditor from '../navs/nav-editor/NavEditor';

const EditorContainer = () => {
	const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
	const editorRef = useRef(null);

	const { hasCommandModifier } = KeyBindingUtil;

	// Focuses the editor on click
	const handleEditorWrapperClick = useCallback((e) => {
		// If clicking inside the editor area but outside the
		//   actual draft-js editor, refocuses on the editor.
		if (e.target.className === 'editor') {
			editorRef.current.focus();
			console.log(
				'Refocused on editor. Should only fire when clicking outside' +
					'the editor component but inside the editor div.'
			);
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
			const newEditorState = RichUtils.onTab(e, editorState, 4);
			if (newEditorState !== editorState) {
				setEditorState(newEditorState);
			}
			return 'handled-in-binding-fn';
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
	const toggleBlockType = (blockType) => {
		setEditorState(RichUtils.toggleBlockType(editorState, blockType));
	};

	// I'll use this and the one above in my NavEditor buttons
	const toggleInlineStyle = (inlineStyle) => {
		setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));
	};

	return (
		<main className='editor-area'>
			<NavEditor />

			<div className='editor' onClick={handleEditorWrapperClick}>
				{/* <button onClick={() => editorRef.current.focus()}>Focus</button> */}
				<Editor
					editorState={editorState}
					onChange={setEditorState}
					ref={editorRef}
					keyBindingFn={customKeyBindingFn}
					handleKeyCommand={handleKeyCommand}
				/>
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
