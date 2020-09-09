import React, { useState, useEffect, useContext } from 'react';

import { FindReplaceContext } from '../../contexts/findReplaceContext';

import CaratDownSVG from '../../assets/svg/CaratDownSVG';
import CloseSVG from '../../assets/svg/CloseSVG';

import Collapse from 'react-css-collapse';

const EditorFindReplace = ({ setShowFindReplace }) => {
	const [showReplace, setShowReplace] = useState(false);
	const [findText, setFindText] = useState('');
	const [replaceText, setReplaceText] = useState('');

	const { setFindText: setContextFindText } = useContext(FindReplaceContext);

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
	});
	// NEXT
	// When expanding, transition down to display the replace below
	// Hook up ctrl + f to Electron
	// Iterate through the text looking for matches, highlight the ranges
	// Escape / X closes
	// https://reactrocket.com/post/draft-js-search-and-replace/
	// https://jsfiddle.net/levsha/o3xyvkw7/

	return (
		<div className='editor-find-container'>
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
				<Collapse
					isOpen={showReplace}
					style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<input
						type='text'
						placeholder='Replace'
						value={replaceText}
						onChange={(e) => setReplaceText(e.target.value)}
					/>
					<button className='find-container-replace-button'>Replace</button>
					<button className='find-container-replace-button'>Replace All</button>
				</Collapse>
			</div>
		</div>
	);
};

export default EditorFindReplace;
