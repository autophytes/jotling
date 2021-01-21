import React, { useState, useContext, useRef } from 'react';

import { LeftNavContext } from '../../../contexts/leftNavContext';
import { FindReplaceContext } from '../../../contexts/findReplaceContext';

import LeftNavContent from './LeftNavContent';
import LeftNavStats from './LeftNavStats';

import LeftNavTopButtons from './LeftNavTopButtons';
import LeftNavTabs from './LeftNavTabs';
import FindAll from './findAll/findAll';

const TAB_NAMES = {
	draft: 'Manuscript',
	research: 'Planning',
	pages: 'Wikis',
};

const LeftNav = () => {
	const { navData, editorStyles, setEditorStyles, resetNavWidth } = useContext(LeftNavContext);
	const { showFindAll } = useContext(FindReplaceContext);

	const [isResizing, setIsResizing] = useState(false);

	const navRef = useRef(null);

	// Resizes the leftNav width when dragging the handle
	const handleResizeMouseDown = (e) => {
		console.log('mouse resizing');
		setIsResizing(true);
		let rootSize = Number(
			window
				.getComputedStyle(document.querySelector(':root'))
				.getPropertyValue('font-size')
				.replace('px', '')
		);

		let minWidth = 10 * rootSize;
		let maxWidth = 25 * rootSize;
		let widthOffset = 2;

		// When the mouse moves, update the width to reflext the mouse's X coordinate
		const handleResizeMouseMove = (e) => {
			if (e.clientX !== 0) {
				let newWidth = Math.min(maxWidth, Math.max(minWidth, e.clientX)) + widthOffset;
				navRef.current.style.width = newWidth + 'px';
			}
		};

		// When finshed resizing, set the width in REMs so it responds to root size changes
		const handleResizeMouseUp = (e) => {
			setIsResizing(false);
			window.removeEventListener('mousemove', handleResizeMouseMove);
			window.removeEventListener('mouseup', handleResizeMouseUp);

			let newWidth = Math.min(maxWidth, Math.max(minWidth, e.clientX));

			setEditorStyles({
				...editorStyles,
				[showFindAll ? 'leftNavFind' : 'leftNav']: newWidth / rootSize,
			});
		};

		window.addEventListener('mousemove', handleResizeMouseMove);
		window.addEventListener('mouseup', handleResizeMouseUp);
	};

	return (
		<>
			<div className='side-nav-hover-region left' />

			<nav
				className={
					'side-nav left-nav animation' + (editorStyles.leftIsPinned ? '' : ' hidden')
				}
				style={{ width: editorStyles[showFindAll ? 'leftNavFind' : 'leftNav'] + 'rem' }}
				ref={navRef}
				id='left-nav'>
				{/* Normal - File Tree */}
				{!showFindAll && (
					<div className='side-nav-container'>
						<LeftNavTopButtons />
						<LeftNavTabs />
						<p className='left-nav-section-title'>
							{TAB_NAMES[navData.currentTab] ? TAB_NAMES[navData.currentTab] : ''}
						</p>
						<LeftNavContent />
						<LeftNavStats />
					</div>
				)}

				{/* Find / Replace - full project search */}
				{showFindAll && <FindAll />}

				{/* Resize Handle */}
				<div className={'vertical-rule vr-left-nav' + (isResizing ? ' primary-color' : '')} />
				<div
					className='vertical-rule-drag-region left'
					onMouseDown={handleResizeMouseDown}
					onDoubleClick={() => resetNavWidth('leftNav')}
				/>
			</nav>
		</>
	);
};

export default LeftNav;
