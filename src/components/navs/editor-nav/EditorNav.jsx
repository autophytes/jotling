import React, { useState, useCallback, useEffect, useContext } from 'react';
// import { getSelectedBlocksMetadata } from 'draftjs-utils';
import { ipcRenderer } from 'electron';

import AddLinkPopper from './AddLinkPopper';
import InlineStyleButton from './InlineStyleButton';

import { LeftNavContext } from '../../../contexts/leftNavContext';
import { SettingsContext } from '../../../contexts/settingsContext';

import PushpinSVG from '../../../assets/svg/PushpinSVG';
import IncreaseFontSizeSVG from '../../../assets/svg/editor/IncreaseFontSizeSVG';
import DecreaseFontSizeSVG from '../../../assets/svg/editor/DecreaseFontSizeSVG';
import BoldSVG from '../../../assets/svg/editor/BoldSVG';
import ItalicSVG from '../../../assets/svg/editor/ItalicSVG';
import UnderlineSVG from '../../../assets/svg/editor/UnderlineSVG';
import StrikethroughSVG from '../../../assets/svg/editor/StrikethroughSVG';
import SubscriptSVG from '../../../assets/svg/editor/SubscriptSVG';
import SuperscriptSVG from '../../../assets/svg/editor/SuperscriptSVG';
import HighlightSVG from '../../../assets/svg/editor/HighlightSVG';
import TextColorSVG from '../../../assets/svg/editor/TextColorSVG';
// import FillColorSVG from '../../../assets/svg/editor/FillColorSVG';
import ListBulletSVG from '../../../assets/svg/editor/ListBulletSVG';
import ListNumberSVG from '../../../assets/svg/editor/ListNumberSVG';
import AlignLeftSVG from '../../../assets/svg/editor/AlignLeftSVG';
import AlignCenterSVG from '../../../assets/svg/editor/AlignCenterSVG';
import AlignRightSVG from '../../../assets/svg/editor/AlignRightSVG';
import AlignJustifySVG from '../../../assets/svg/editor/AlignJustifySVG';
import LineSpacingSVG from '../../../assets/svg/editor/LineSpacingSVG';
import SpellcheckSVG from '../../../assets/svg/editor/SpellcheckSVG';
import ChainSVG from '../../../assets/svg/ChainSVG';

// AVAILABLE BLOCKS - https://draftjs.org/docs/api-reference-content-block#representing-styles-and-entities
// unstyled
// paragraph
// header-one
// header-two
// header-three
// header-four
// header-five
// header-six
// unordered-list-item
// ordered-list-item
// blockquote
// code-block
// atomic

// AVAILABLE STYLES BY DEFAULT - https://draftjs.org/docs/advanced-topics-inline-styles/#mapping-a-style-string-to-css
// BOLD
// ITALIC
// UNDERLINE
// CODE (monospace)
// STRIKETHROUGH (added in customStyleMap)

const BLOCK_TYPES = [
	{ label: 'Normal', style: 'unstyled' },
	{ label: 'Heading 1', style: 'header-one' },
	{ label: 'Heading 2', style: 'header-two' },
	{ label: 'Heading 3', style: 'header-three' },
	{ label: 'Heading 4', style: 'header-four' },
	// { label: 'H5', style: 'header-five' },
	// { label: 'H6', style: 'header-six' },
	{ label: 'Quote', style: 'blockquote' },
	// { label: 'UL', style: 'unordered-list-item' },
	// { label: 'OL', style: 'ordered-list-item' },
	{ label: 'Code', style: 'code-block' },
];

const INLINE_STYLES = [
	{ label: 'Bold', style: 'BOLD' },
	{ label: 'Italic', style: 'ITALIC' },
	{ label: 'Underline', style: 'UNDERLINE' },
	{ label: 'Monospace', style: 'CODE' },
];

const MAX_RECENT_FONTS = 5;

// COMPONENT
const EditorNav = React.memo(
	({
		toggleBlockType,
		toggleBlockStyle,
		toggleInlineStyle,
		toggleTextAlign,
		spellCheck,
		toggleSpellCheck,
		saveFile,
		loadFile,
		currentAlignment,
		currentStyles,
		createTagLink,
		editorContainerRef,
	}) => {
		// STATE
		const [pinNav, setPinNav] = useState(true);
		const [displayLinkPopper, setDisplayLinkPopper] = useState(false);
		const [hoverRegionLeft, setHoverRegionLeft] = useState(0);
		const [hoverRegionRight, setHoverRegionRight] = useState(0);
		const [blockType, setBlockType] = useState('unstyled');

		// CONTEXT
		const { editorStyles } = useContext(LeftNavContext);
		const { editorSettings } = useContext(SettingsContext);

		// Calculates the left and right hover region boundaries
		useEffect(() => {
			let rootSize = Number(
				window
					.getComputedStyle(document.querySelector(':root'))
					.getPropertyValue('font-size')
					.replace('px', '')
			);

			let leftNav = editorStyles.leftIsPinned ? editorStyles.leftNav * rootSize : 0;
			let rightNav = editorStyles.rightIsPinned ? editorStyles.rightNav * rootSize : 0;
			let maxEditor = editorSettings.editorMaxWidth * rootSize;
			let windowWidth = window.innerWidth;
			let gutter = Math.max(windowWidth - leftNav - rightNav - maxEditor, 0);
			let newLeftOffset = leftNav + gutter / 2;
			let newRightOffset = rightNav + gutter / 2;

			setHoverRegionLeft(newLeftOffset);
			setHoverRegionRight(newRightOffset);
		}, [editorStyles, editorSettings]);

		return (
			<>
				<div className='editor-nav-hover-region' />
				<nav
					className={'editor-nav' + (pinNav ? '' : ' hidden')}
					// style={{
					// 	maxWidth: `calc(100% - ${
					// 		(editorStyles.leftIsPinned ? editorStyles.leftNav : 0) +
					// 		(editorStyles.rightIsPinned ? editorStyles.rightNav : 0)
					// 	}rem)`,
					// }}
				>
					{/* <!-- Should most of these be document-wide rather than selection specific? --> */}
					<span className='editor-nav-subsection'>
						<button
							className={'nav-button' + (pinNav ? ' active' : '')}
							style={{ marginRight: '0.5rem' }}
							onMouseUp={() => setPinNav(!pinNav)}>
							<PushpinSVG />
						</button>

						<select
							value={blockType}
							onChange={(e) => {
								toggleBlockType(e, e.target.value);
								setBlockType(e.target.value);
							}}>
							{BLOCK_TYPES.map((item, i) => {
								return (
									<option key={i} value={item.style}>
										{item.label}
									</option>
								);
							})}
						</select>

						{/* <input
							type='number'
							min='0'
							max='999'
							value={fontSize}
							onChange={(e) => setFontSize(e.target.value)}
							style={{ marginLeft: '0.5rem' }}
						/>
						<button
							className='nav-button'
							onClick={() => increaseDecreaseFontSize('decrease')}
							style={{ marginRight: '0' }}>
							<DecreaseFontSizeSVG />
						</button>
						<button
							className='nav-button'
							onClick={() => increaseDecreaseFontSize('increase')}
							style={{ marginLeft: '0' }}>
							<IncreaseFontSizeSVG />
						</button>

						<input
							type='number'
							min='0'
							max='10'
							step='0.1'
							value={lineHeight}
							onChange={(e) => setLineHeight(e.target.value)}
							style={{ marginLeft: '0.5rem' }}
						/>
						<button className='nav-button' disabled>
							<LineSpacingSVG />
						</button> */}
					</span>

					{/* <div className='editor-nav-vertical-rule' /> */}

					<span className='editor-nav-subsection'>
						<InlineStyleButton
							currentStyles={currentStyles}
							toggleFn={toggleInlineStyle}
							style='BOLD'>
							<BoldSVG />
						</InlineStyleButton>

						<InlineStyleButton
							currentStyles={currentStyles}
							toggleFn={toggleInlineStyle}
							style='ITALIC'>
							<ItalicSVG />
						</InlineStyleButton>

						<InlineStyleButton
							currentStyles={currentStyles}
							toggleFn={toggleInlineStyle}
							style='UNDERLINE'>
							<UnderlineSVG />
						</InlineStyleButton>

						<InlineStyleButton
							currentStyles={currentStyles}
							toggleFn={toggleInlineStyle}
							style='STRIKETHROUGH'>
							<StrikethroughSVG />
						</InlineStyleButton>

						<InlineStyleButton
							currentStyles={currentStyles}
							toggleFn={toggleInlineStyle}
							style='SUBSCRIPT'
							removeStyle='SUPERSCRIPT'>
							<SubscriptSVG />
						</InlineStyleButton>

						<InlineStyleButton
							currentStyles={currentStyles}
							toggleFn={toggleInlineStyle}
							style='SUPERSCRIPT'
							removeStyle='SUBSCRIPT'>
							<SuperscriptSVG />
						</InlineStyleButton>

						<button
							className='nav-button'
							onMouseDown={(e) => e.preventDefault()}
							onClick={(e) => {
								e.stopPropagation();
								if (document.getSelection().toString().length) {
									setDisplayLinkPopper(true);
								}
							}}>
							<ChainSVG />
						</button>
						{/* Add Tag Popper */}
						{/* When rendering this overlay, we also need to render an application-wide overlay that, when clicked on, runs a callback function
                to close the popper. This can later be used for confirmation messages and things like that. */}
						{displayLinkPopper && (
							<AddLinkPopper {...{ createTagLink, setDisplayLinkPopper }} />
						)}

						<button className='nav-button' onClick={() => saveFile()}>
							<HighlightSVG />
						</button>
						<button className='nav-button' onClick={() => loadFile()}>
							<TextColorSVG />
						</button>

						<button
							className='nav-button'
							onMouseDown={(e) => toggleBlockType(e, 'unordered-list-item')}>
							<ListBulletSVG />
						</button>

						<button
							className='nav-button'
							onMouseDown={(e) => toggleBlockType(e, 'ordered-list-item')}>
							<ListNumberSVG />
						</button>

						<button
							className={'nav-button' + (currentAlignment === 'left' ? ' active' : '')}
							onMouseDown={(e) => {
								toggleTextAlign(e, 'left', currentAlignment);
							}}>
							<AlignLeftSVG />
						</button>

						<button
							className={'nav-button' + (currentAlignment === 'center' ? ' active' : '')}
							onMouseDown={(e) => {
								toggleTextAlign(e, 'center', currentAlignment);
							}}>
							<AlignCenterSVG />
						</button>

						<button
							className={'nav-button' + (currentAlignment === 'right' ? ' active' : '')}
							onMouseDown={(e) => {
								toggleTextAlign(e, 'right', currentAlignment);
							}}>
							<AlignRightSVG />
						</button>

						<button
							className={'nav-button' + (currentAlignment === 'justify' ? ' active' : '')}
							onMouseDown={(e) => {
								toggleTextAlign(e, 'justify', currentAlignment);
							}}>
							<AlignJustifySVG />
						</button>

						<button
							className={'nav-button' + (spellCheck ? ' active' : '')}
							onMouseDown={(e) => toggleSpellCheck(e)}>
							<SpellcheckSVG />
						</button>
					</span>
				</nav>
			</>
		);
	}
);

export default EditorNav;
