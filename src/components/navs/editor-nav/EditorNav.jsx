import React, { useState, useEffect, useContext, useRef } from 'react';
import Immutable from 'immutable';

import AddToWikiPopper from './AddToWiki/AddToWikiPopper';
import InlineStyleButton from './InlineStyleButton';
import ColorPickerPopper from './ColorPickerPopper';

import { LeftNavContext } from '../../../contexts/leftNavContext';
import { SettingsContext } from '../../../contexts/settingsContext';

import PushpinSVG from '../../../assets/svg/PushpinSVG';
import BoldSVG from '../../../assets/svg/editor/BoldSVG';
import ItalicSVG from '../../../assets/svg/editor/ItalicSVG';
import UnderlineSVG from '../../../assets/svg/editor/UnderlineSVG';
import StrikethroughSVG from '../../../assets/svg/editor/StrikethroughSVG';
import SubscriptSVG from '../../../assets/svg/editor/SubscriptSVG';
import SuperscriptSVG from '../../../assets/svg/editor/SuperscriptSVG';
import HighlightSVG from '../../../assets/svg/editor/HighlightSVG';
import TextColorSVG from '../../../assets/svg/editor/TextColorSVG';
import ListBulletSVG from '../../../assets/svg/editor/ListBulletSVG';
import ListNumberSVG from '../../../assets/svg/editor/ListNumberSVG';
import AlignLeftSVG from '../../../assets/svg/editor/AlignLeftSVG';
import AlignCenterSVG from '../../../assets/svg/editor/AlignCenterSVG';
import AlignRightSVG from '../../../assets/svg/editor/AlignRightSVG';
import AlignJustifySVG from '../../../assets/svg/editor/AlignJustifySVG';
import SpellcheckSVG from '../../../assets/svg/editor/SpellcheckSVG';
import ChainSVG from '../../../assets/svg/ChainSVG';
import EyeSVG from '../../../assets/svg/EyeSVG';
import EyeHideSVG from '../../../assets/svg/EyeHideSVG';
import ImageSVG from '../../../assets/svg/ImageSVG';
import CaratDownSVG from '../../../assets/svg/CaratDownSVG';
import InsertSectionSVG from '../../../assets/svg/editor/InsertSectionSVG';

import {
	toggleBlockType,
	toggleTextAlign,
	toggleTextCustomStyle,
} from '../../editor/editorStyleFunctions';

import { insertNewSectionInOpenDoc } from '../../editor/editorFunctions';

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
	// { label: 'Section', style: 'wiki-section', tab: 'pages' },
];

const INLINE_STYLES = [
	{ label: 'Bold', style: 'BOLD' },
	{ label: 'Italic', style: 'ITALIC' },
	{ label: 'Underline', style: 'UNDERLINE' },
	{ label: 'Monospace', style: 'CODE' },
];

const MAX_RECENT_FONTS = 5;

// COMPONENT
const EditorNav = React.memo(({ spellCheck, toggleSpellCheck, editorRef, navSettersRef }) => {
	// STATE
	const [pinNav, setPinNav] = useState(true);
	// const [hoverRegionLeft, setHoverRegionLeft] = useState(0);
	// const [hoverRegionRight, setHoverRegionRight] = useState(0);
	const [showColorPicker, setShowColorPicker] = useState('');
	const [currentStyles, setCurrentStyles] = useState(Immutable.Set());
	const [currentBlockType, setCurrentBlockType] = useState('unstyled');
	const [currentAlignment, setCurrentAlignment] = useState('');

	// CONTEXT
	const {
		editorStyles,
		setEditorStyles,
		displayWikiPopper,
		setDisplayWikiPopper,
		setDocStructure,
		linkStructure,
		setLinkStructure,
		setShowUploadImage,
		editorStateRef,
		setEditorStateRef,
		navData,
	} = useContext(LeftNavContext);
	const { highlightColor, setHighlightColor, textColor, setTextColor } = useContext(
		SettingsContext
	);

	// REFS
	const highlightColorRef = useRef(null);
	const textColorRef = useRef(null);

	// Curried toggleTextAlign function
	const wrappedToggleTextAlign = (newAlignment) => (e) =>
		toggleTextAlign(
			e,
			newAlignment,
			currentAlignment,
			editorStateRef.current,
			setEditorStateRef.current
		);

	// Curried toggleBlockType function
	const wrappedToggleBlockType = (newBlockType) => (e) =>
		toggleBlockType(e, newBlockType, editorStateRef.current, setEditorStateRef.current);

	// Gives the editorContainer access to the setter functions
	useEffect(() => {
		navSettersRef.current = {
			setCurrentStyles,
			setCurrentBlockType,
			setCurrentAlignment,
		};
	}, []);

	// TEMPORARY. Cleans up old projects that still have docTags.
	useEffect(() => {
		if (linkStructure.docTags) {
			let newLinkStructure = JSON.parse(JSON.stringify(linkStructure));
			delete newLinkStructure.docTags;
			setLinkStructure(newLinkStructure);
		}
	}, [linkStructure]);

	// Calculates the left and right hover region boundaries
	// useEffect(() => {
	// 	let rootSize = Number(
	// 		window
	// 			.getComputedStyle(document.querySelector(':root'))
	// 			.getPropertyValue('font-size')
	// 			.replace('px', '')
	// 	);

	// 	let leftNav = editorStyles.leftIsPinned ? editorStyles.leftNav * rootSize : 0;
	// 	let rightNav = editorStyles.rightIsPinned ? editorStyles.rightNav * rootSize : 0;
	// 	let maxEditor = editorSettings.editorMaxWidth * rootSize;
	// 	let windowWidth = window.innerWidth;
	// 	let gutter = Math.max(windowWidth - leftNav - rightNav - maxEditor, 0);
	// 	let newLeftOffset = leftNav + gutter / 2;
	// 	let newRightOffset = rightNav + gutter / 2;

	// 	setHoverRegionLeft(newLeftOffset);
	// 	setHoverRegionRight(newRightOffset);
	// }, [editorStyles, editorSettings]);

	return (
		<>
			<div className='editor-nav-hover-region' />
			<nav
				className={'editor-nav' + (pinNav ? '' : ' hidden')}
				onMouseDown={(e) => {
					if (
						e.target.classList.contains('editor-nav') ||
						e.target.classList.contains('editor-nav-subsection')
					) {
						e.preventDefault();
					}
				}}>
				<span className='editor-nav-subsection'>
					<button
						className={'nav-button' + (pinNav ? ' active' : '')}
						title='Pin Editor Tools'
						style={{ marginRight: '0.5rem' }}
						onMouseUp={() => setPinNav(!pinNav)}>
						<PushpinSVG />
					</button>

					<select
						value={currentBlockType}
						onMouseDown={(e) => {
							e.stopPropagation();
							console.log('moused down');
						}}
						onChange={(e) => wrappedToggleBlockType(e.target.value)(e)}>
						{BLOCK_TYPES.map((item, i) => (
							<option key={i} value={item.style}>
								{item.label}
							</option>
						))}
					</select>

					<InlineStyleButton currentStyles={currentStyles} style='BOLD'>
						<BoldSVG />
					</InlineStyleButton>

					<InlineStyleButton currentStyles={currentStyles} style='ITALIC'>
						<ItalicSVG />
					</InlineStyleButton>

					<InlineStyleButton currentStyles={currentStyles} style='UNDERLINE'>
						<UnderlineSVG />
					</InlineStyleButton>

					<InlineStyleButton currentStyles={currentStyles} style='STRIKETHROUGH'>
						<StrikethroughSVG />
					</InlineStyleButton>

					<InlineStyleButton
						currentStyles={currentStyles}
						style='SUBSCRIPT'
						injectStyle={{ paddingTop: '5px' }}
						removeStyle='SUPERSCRIPT'>
						<SubscriptSVG />
					</InlineStyleButton>

					<InlineStyleButton
						currentStyles={currentStyles}
						style='SUPERSCRIPT'
						injectStyle={{ paddingBottom: '5px' }}
						removeStyle='SUBSCRIPT'>
						<SuperscriptSVG />
					</InlineStyleButton>
				</span>

				<span className='editor-nav-subsection'>
					{/* Highlight Color */}
					<button
						className='nav-button'
						title='Highlight Text'
						style={{ marginRight: 0 }}
						onMouseDown={(e) => e.preventDefault()}
						onClick={(e) => {
							console.log('highlightColor.color:', highlightColor.color);
							toggleTextCustomStyle(
								e,
								highlightColor.color,
								'highlight',
								editorStateRef.current,
								setEditorStateRef.current,
								setDocStructure
							);
						}}>
						<HighlightSVG color={highlightColor.color} />
					</button>
					<button
						className='nav-button expand-nav-button'
						title='Choose Highlight Color'
						onMouseDown={(e) => e.preventDefault()}
						onClick={(e) => {
							e.stopPropagation();
							setShowColorPicker((prev) => (prev !== 'highlight' ? 'highlight' : ''));
						}}
						ref={highlightColorRef}>
						<CaratDownSVG />
					</button>
					{showColorPicker === 'highlight' && (
						<ColorPickerPopper
							referenceElement={highlightColorRef.current}
							closeFn={() => {
								editorRef.current.focus();
								setShowColorPicker('');
							}}
							colorObj={highlightColor}
							setColorObj={setHighlightColor}
							setColorFn={(e, color, remove) => {
								toggleTextCustomStyle(
									e,
									color,
									'highlight',
									editorStateRef.current,
									setEditorStateRef.current,
									setDocStructure,
									remove
								);
							}}
						/>
					)}

					{/* Text Color */}
					<button
						className='nav-button'
						title='Text Color'
						style={{ marginRight: 0 }}
						onMouseDown={(e) => e.preventDefault()}
						onClick={(e) => {
							toggleTextCustomStyle(
								e,
								textColor.color,
								'textColor',
								editorStateRef.current,
								setEditorStateRef.current,
								setDocStructure
							);
						}}
						ref={textColorRef}>
						<TextColorSVG color={textColor.color} />
					</button>
					<button
						className='nav-button expand-nav-button'
						title='Choose Text Color'
						onMouseDown={(e) => e.preventDefault()}
						onClick={(e) => {
							e.stopPropagation();
							setShowColorPicker((prev) => (prev !== 'text' ? 'text' : ''));
						}}
						ref={textColorRef}>
						<CaratDownSVG />
					</button>
					{showColorPicker === 'text' && (
						<ColorPickerPopper
							referenceElement={textColorRef.current}
							closeFn={() => {
								editorRef.current.focus();
								setShowColorPicker('');
							}}
							colorObj={textColor}
							setColorObj={setTextColor}
							setColorFn={(e, color) => {
								toggleTextCustomStyle(
									e,
									color,
									'textColor',
									editorStateRef.current,
									setEditorStateRef.current,
									setDocStructure
								);
							}}
						/>
					)}

					<button
						className={
							'nav-button' + (currentBlockType === 'unordered-list-item' ? ' active' : '')
						}
						title='Bulleted List'
						onMouseDown={wrappedToggleBlockType('unordered-list-item')}>
						<ListBulletSVG />
					</button>

					<button
						className={
							'nav-button' + (currentBlockType === 'ordered-list-item' ? ' active' : '')
						}
						title='Numbered List'
						onMouseDown={wrappedToggleBlockType('ordered-list-item')}>
						<ListNumberSVG />
					</button>

					<button
						className={'nav-button' + (currentAlignment === 'left' ? ' active' : '')}
						title='Align Left'
						onMouseDown={wrappedToggleTextAlign('left')}>
						<AlignLeftSVG />
					</button>

					<button
						className={'nav-button' + (currentAlignment === 'center' ? ' active' : '')}
						title='Align Center'
						onMouseDown={wrappedToggleTextAlign('center')}>
						<AlignCenterSVG />
					</button>

					<button
						className={'nav-button' + (currentAlignment === 'right' ? ' active' : '')}
						title='Align Right'
						onMouseDown={wrappedToggleTextAlign('right')}>
						<AlignRightSVG />
					</button>

					<button
						className={'nav-button' + (currentAlignment === 'justify' ? ' active' : '')}
						title='Justify Text'
						onMouseDown={wrappedToggleTextAlign('justify')}>
						<AlignJustifySVG />
					</button>

					<button
						className={'nav-button' + (navData.currentDocTab !== 'pages' ? ' disabled' : '')}
						title='Insert Section'
						onMouseDown={(e) => {
							e.preventDefault();
							if (navData.currentDocTab === 'pages') {
								insertNewSectionInOpenDoc(editorStateRef.current, setEditorStateRef.current);
								// editorRef.current.focus();
								// setTimeout(() => editorRef.current.focus(), 0);
							}
						}}>
						<InsertSectionSVG />
					</button>

					<div className='editor-nav-vertical-rule' />

					<button
						className={'nav-button' + (spellCheck ? ' active' : '')}
						title='Toggle Spellcheck'
						onMouseDown={(e) => toggleSpellCheck(e)}>
						<SpellcheckSVG />
					</button>

					<button
						className='nav-button'
						title='Add to Wiki'
						onMouseDown={(e) => e.preventDefault()}
						onClick={(e) => {
							e.stopPropagation();

							if (document.getSelection().toString().length) {
								console.log(
									'document.getSelection().toString(): ',
									document.getSelection().toString()
								);

								const selectionState = editorStateRef.current.getSelection();
								console.log('selectionState start:', selectionState.getStartOffset());
								console.log('selectionState end:', selectionState.getEndOffset());
								console.log('selectionState start:', selectionState.getStartKey());
								console.log('selectionState end:', selectionState.getEndKey());

								setDisplayWikiPopper(true);
							}
						}}>
						<ChainSVG />
					</button>

					{/* Show / Hide Keys/Links */}
					<button
						className={'nav-button' + (editorStyles.showAllTags ? ' active' : '')}
						title='Show Wiki Links'
						onMouseDown={(e) => {
							e.preventDefault();
							setEditorStyles({
								...editorStyles,
								showAllTags: !editorStyles.showAllTags,
							});
						}}>
						{editorStyles.showAllTags ? <EyeSVG /> : <EyeHideSVG />}
					</button>

					<button
						className='nav-button'
						title='Insert Image'
						onMouseDown={(e) => e.preventDefault()}
						onClick={() => setShowUploadImage(true)}>
						<ImageSVG />
					</button>

					{/* Add Tag Popper */}
					{/* When rendering this overlay, we also need to render an application-wide overlay that, when clicked on, runs a callback function
                to close the popper. This can later be used for confirmation messages and things like that. */}
					{displayWikiPopper && <AddToWikiPopper />}
				</span>
			</nav>
		</>
	);
});

export default EditorNav;
