import React, { useState, useRef, useContext } from 'react';

import { LeftNavContext } from '../../../contexts/leftNavContext';
import { RightNavContext } from '../../../contexts/rightNavContext';

import PushpinSVG from '../../../assets/svg/PushpinSVG';
import TagSingleSVG from '../../../assets/svg/TagSingleSVG';
import SettingsDocSVG from '../../../assets/svg/SettingsDocSVG';
import DocumentInfoSVG from '../../../assets/svg/DocumentInfoSVG';
import RightNavContent from './RightNavContent';
import RightNavTags from './RightNavTags/RightNavTags';

const RightNav = () => {
	// STATE
	// const [pinNav, setPinNav] = useState(false);
	const [isResizing, setIsResizing] = useState(false);

	// CONTEXT
	const { editorStyles, setEditorStyles, resetNavWidth } = useContext(LeftNavContext);
	const { activeTab, setActiveTab } = useContext(RightNavContext);
	const pinNav = editorStyles.rightIsPinned;

	// REFS
	const navRef = useRef(null);

	const handleResizeMouseDown = (e) => {
		console.log('mouse resizing');
		setIsResizing(true);
		let rootSize = Number(
			window
				.getComputedStyle(document.querySelector(':root'))
				.getPropertyValue('font-size')
				.replace('px', '')
		);

		let windowWidth = window.innerWidth;
		let minWidth = 10 * rootSize;
		let maxWidth = 25 * rootSize;
		let widthOffset = 1;

		const handleResizeMouseMove = (e) => {
			if (e.clientX !== 0) {
				let newWidth =
					Math.min(maxWidth, Math.max(minWidth, windowWidth - e.clientX)) + widthOffset;
				navRef.current.style.width = newWidth + 'px';
			}
		};

		const handleResizeMouseUp = (e) => {
			setIsResizing(false);
			window.removeEventListener('mousemove', handleResizeMouseMove);
			window.removeEventListener('mouseup', handleResizeMouseUp);

			let newWidth =
				Math.min(maxWidth, Math.max(minWidth, windowWidth - e.clientX)) + widthOffset;

			setEditorStyles({ ...editorStyles, rightNav: newWidth / rootSize });
		};

		window.addEventListener('mousemove', handleResizeMouseMove);
		window.addEventListener('mouseup', handleResizeMouseUp);
	};

	return (
		<>
			<div className='side-nav-hover-region right' />
			<nav
				className={'side-nav right-nav' + (pinNav ? '' : ' hidden')}
				id={'right-nav'}
				style={{ width: editorStyles.rightNav + 'rem' }}
				ref={navRef}>
				<div className={'vertical-rule vr-right-nav' + (isResizing ? ' primary-color' : '')} />
				<div
					className='vertical-rule-drag-region right'
					onMouseDown={handleResizeMouseDown}
					onDoubleClick={() => resetNavWidth('rightNav')}
					// style={pinNav ? {} : { cursor: 'inherit' }}
					// {...(pinNav && {
					// 	onMouseDown: handleResizeMouseDown,
					// 	onDoubleClick: () => resetNavWidth('rightNav'),
					// })}
				/>
				<div className='side-nav-container'>
					<div className='right-nav-top-buttons'>
						<button
							className={'nav-button' + (pinNav ? ' active' : '')}
							onMouseUp={() => {
								// setPinNav(!pinNav);
								setEditorStyles({ ...editorStyles, rightIsPinned: !pinNav });
							}}>
							<PushpinSVG />
						</button>
					</div>
					<div className='right-nav-sections'>
						<div
							className={'nav-section-tab' + (activeTab === 'tags' ? ' active' : '')}
							onClick={() => setActiveTab('tags')}>
							<TagSingleSVG />
						</div>
						<div
							className={'nav-section-tab first' + (activeTab === 'document' ? ' active' : '')}
							onClick={() => setActiveTab('document')}>
							<DocumentInfoSVG />
						</div>
						<div
							className={'nav-section-tab last' + (activeTab === 'settings' ? ' active' : '')}
							onClick={() => setActiveTab('settings')}>
							<SettingsDocSVG />
						</div>
					</div>

					{/* <RightNavContent {...{ activeTab }} /> */}
					{activeTab === 'tags' && <RightNavTags {...{ activeTab }} />}

					<div className='right-nav-footer'>
						<div>current version</div>
					</div>
				</div>
			</nav>
		</>
	);
};

export default RightNav;
