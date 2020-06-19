import React, { useState, useCallback } from 'react';
import { getSelectedBlocksMetadata } from 'draftjs-utils';

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
import FillColorSVG from '../../../assets/svg/editor/FillColorSVG';
import ListBulletSVG from '../../../assets/svg/editor/ListBulletSVG';
import ListNumberSVG from '../../../assets/svg/editor/ListNumberSVG';
import AlignLeftSVG from '../../../assets/svg/editor/AlignLeftSVG';
import AlignCenterSVG from '../../../assets/svg/editor/AlignCenterSVG';
import AlignRightSVG from '../../../assets/svg/editor/AlignRightSVG';
import AlignJustifySVG from '../../../assets/svg/editor/AlignJustifySVG';
import LineSpacingSVG from '../../../assets/svg/editor/LineSpacingSVG';
import SpellcheckSVG from '../../../assets/svg/editor/SpellcheckSVG';

import InlineStyleButton from './InlineStyleButton';

const BLOCK_TYPES = [
	{ label: 'H1', style: 'header-one' },
	{ label: 'H2', style: 'header-two' },
	{ label: 'H3', style: 'header-three' },
	{ label: 'H4', style: 'header-four' },
	{ label: 'H5', style: 'header-five' },
	{ label: 'H6', style: 'header-six' },
	{ label: 'Blockquote', style: 'blockquote' },
	{ label: 'UL', style: 'unordered-list-item' },
	{ label: 'OL', style: 'ordered-list-item' },
	{ label: 'Code Block', style: 'code-block' },
];

const MAX_RECENT_FONTS = 5;

// COMPONENT
const NavEditor = ({
	editorState,
	toggleBlockType,
	toggleBlockStyle,
	toggleInlineStyle,
	toggleTextAlign,
	spellCheck,
	toggleSpellCheck,
	currentFont,
	setCurrentFont,
	fontList,
	fontSize,
	setFontSize,
	lineHeight,
	setLineHeight,
}) => {
	// REQUIRES toggleInlineStyle & toggleBlockType

	const currentStyles = editorState.getCurrentInlineStyle();
	const currentAlignment = getSelectedBlocksMetadata(editorState).get('text-align');

	const [recentlyUsedFonts, setRecentlyUsedFonts] = useState([]);
	// const [fontSize, setFontSize] = useState(null);

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

	const INLINE_STYLES = [
		{ label: 'Bold', style: 'BOLD' },
		{ label: 'Italic', style: 'ITALIC' },
		{ label: 'Underline', style: 'UNDERLINE' },
		{ label: 'Monospace', style: 'CODE' },
	];

	const handleFontSelect = useCallback(
		(font) => {
			const fontIndex = recentlyUsedFonts.indexOf(font);
			if (fontIndex !== 0) {
				let recentFonts = [...recentlyUsedFonts];

				// If already in the list, remove so we can add it to the front
				if (fontIndex > 0) {
					recentFonts.splice(fontIndex, 1);
				}

				recentFonts.unshift(font);

				// Trim down to max length (min 0)
				while (recentFonts.length > MAX_RECENT_FONTS && recentFonts.length > 0) {
					recentFonts.pop();
				}

				setRecentlyUsedFonts(recentFonts);
			}

			setCurrentFont(font);
		},
		[setCurrentFont, recentlyUsedFonts, setRecentlyUsedFonts]
	);

	// Will either 'increase' or 'decrease' font size
	const increaseDecreaseFontSize = useCallback(
		(direction) => {
			let oldSize = typeof fontSize === 'string' ? Number(fontSize) : fontSize;
			console.log('parsing ints?');

			if (direction === 'increase') {
				if (oldSize < 12) {
					console.log('< 12');
					setFontSize(Math.floor(oldSize + 1));
				} else if (oldSize < 28) {
					setFontSize(Math.floor((oldSize + 2) * 2) / 2);
				} else if (oldSize < 70) {
					setFontSize(Math.floor((oldSize + 6) * 6) / 6);
				} else {
					setFontSize(Math.floor((oldSize + 12) * 12) / 12);
				}
			}
			if (direction === 'decrease') {
				if (oldSize > 70) {
					setFontSize(Math.ceil((oldSize - 12) / 12) * 12);
				} else if (oldSize > 28) {
					setFontSize(Math.ceil((oldSize - 6) / 6) * 6);
				} else if (oldSize > 12) {
					setFontSize(Math.ceil((oldSize - 2) / 2) * 2);
				} else {
					setFontSize(Math.max(Math.ceil(oldSize - 1), 1));
				}
			}
		},
		[fontSize]
	);

	return (
		<nav className='editor-nav'>
			<button className='nav-button'>
				{/* <img src='icons/pushpin.svg' /> */}
				<PushpinSVG />
			</button>

			{/* <!-- Should most of these be document-wide rather than selection specific? --> */}
			<select value={currentFont} onChange={(e) => handleFontSelect(e.target.value)}>
				{recentlyUsedFonts.map((font, i) => (
					<option key={i} value={font}>
						{font}
					</option>
				))}
				<option disabled>- - - - -</option>

				{fontList.map((font, i) => {
					const trimFont = font.replace(/["]+/g, '');
					return (
						<option key={i} value={trimFont}>
							{trimFont}
						</option>
					);
				})}
			</select>

			<input
				type='number'
				min='0'
				max='999'
				value={fontSize}
				onChange={(e) => setFontSize(e.target.value)}
				style={{ marginLeft: '0.5rem' }}
			/>
			<button className='nav-button' onClick={() => increaseDecreaseFontSize('increase')}>
				<IncreaseFontSizeSVG />
			</button>
			<button className='nav-button' onClick={() => increaseDecreaseFontSize('decrease')}>
				<DecreaseFontSizeSVG />
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
			</button>

			<div className='editor-nav-vertical-rule' />

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

			<button className='nav-button'>
				<HighlightSVG />
			</button>
			<button className='nav-button'>
				<TextColorSVG />
			</button>
			<button className='nav-button'>
				<FillColorSVG />
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
		</nav>
	);
};

export default NavEditor;
