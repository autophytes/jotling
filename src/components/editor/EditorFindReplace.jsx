import React, { useState, useEffect, useContext } from 'react';

import { FindReplaceContext } from '../../contexts/findReplaceContext';
import { LeftNavContext } from '../../contexts/leftNavContext';

import CaratDownSVG from '../../assets/svg/CaratDownSVG';
import CloseSVG from '../../assets/svg/CloseSVG';

import Collapse from 'react-css-collapse';

const repositionFindPopper = (editorStyles, setRightOffset) => {
	let rootSize = Number(
		window
			.getComputedStyle(document.querySelector(':root'))
			.getPropertyValue('font-size')
			.replace('px', '')
	);

	let leftNav = editorStyles.leftIsPinned ? editorStyles.leftNav * rootSize : 0;
	let rightNav = editorStyles.rightIsPinned ? editorStyles.rightNav * rootSize : 0;
	let maxEditor = editorStyles.editorMaxWidth * rootSize;
	let windowWidth = window.innerWidth;
	let gutter = Math.max(windowWidth - leftNav - rightNav - maxEditor, 0);
	// let newLeftOffset = leftNav + gutter / 2;
	let newRightOffset = rightNav + gutter / 2 + 0.5 * rootSize;

	// setLeftOffset(newLeftOffset);
	setRightOffset(newRightOffset);
};

const EditorFindReplace = () => {
	// STATE
	const [showReplace, setShowReplace] = useState(false);
	const [findText, setFindText] = useState('');
	const [replaceText, setReplaceText] = useState('');
	const [rightOffset, setRightOffset] = useState(13);

	// CONTEXT
	const {
		setFindText: setContextFindText,
		setShowFindReplace,
		replaceDefaultOn,
		setReplaceDefaultOn,
	} = useContext(FindReplaceContext);
	const { editorStyles } = useContext(LeftNavContext);

	useEffect(() => {
		setShowReplace(replaceDefaultOn);
		setReplaceDefaultOn(false);
	}, []);

	// Reregister window resize listener to reposition the popper
	useEffect(() => {
		const reposition = () => {
			repositionFindPopper(editorStyles, setRightOffset);
		};

		window.addEventListener('resize', reposition);

		return () => {
			window.removeEventListener('resize', reposition);
		};
	}, [editorStyles]);

	// Recalculate the position of the popper
	useEffect(() => {
		repositionFindPopper(editorStyles, setRightOffset);
	}, [editorStyles]);

	useEffect(() => {
		const closeEventListener = (e) => {
			if (e.keyCode === 27) {
				// Clear our search variable
				setContextFindText('');
				setShowFindReplace(false);
			}
		};
		document.addEventListener('keyup', closeEventListener);

		return () => document.removeEventListener('keyup', closeEventListener);
	}, []);
	// NEXT
	// Implement the replace
	// https://reactrocket.com/post/draft-js-search-and-replace/
	// https://jsfiddle.net/levsha/o3xyvkw7/

	return (
		<div className='editor-find-container' style={{ right: rightOffset }}>
			<div
				className={'find-container-svg' + (showReplace ? ' expanded' : '')}
				onClick={() => setShowReplace(!showReplace)}>
				<CaratDownSVG rotate='-90' />
			</div>
			<div>
				<div style={{ display: 'flex' }}>
					<input
						type='text'
						placeholder='Find'
						value={findText}
						onChange={(e) => {
							setFindText(e.target.value);
							setContextFindText(e.target.value);
						}}
					/>
					<p className='find-containter-counter'>999 of 999</p>
					<div className='find-container-svg'>
						<CaratDownSVG rotate='90' />
					</div>
					<div className='find-container-svg'>
						<CaratDownSVG rotate='-90' />
					</div>
					<div className='find-container-svg' onClick={() => setShowFindReplace(false)}>
						<CloseSVG />
					</div>
				</div>
				<Collapse isOpen={showReplace}>
					<div
						style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<input
							type='text'
							placeholder='Replace'
							value={replaceText}
							onChange={(e) => setReplaceText(e.target.value)}
						/>
						<button className='find-container-replace-button'>Replace</button>
						<button className='find-container-replace-button'>Replace All</button>
					</div>
				</Collapse>
			</div>
		</div>
	);
};

export default EditorFindReplace;
