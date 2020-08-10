import React, { useState, useRef } from 'react';

import PushpinSVG from '../../../assets/svg/PushpinSVG';
import TagSingleSVG from '../../../assets/svg/TagSingleSVG';
import SettingsDocSVG from '../../../assets/svg/SettingsDocSVG';
import DocumentInfoSVG from '../../../assets/svg/DocumentInfoSVG';
import RightNavContent from './RightNavContent';

const RightNav = ({ editorWidth, setEditorWidth, resetNavWidth }) => {
	const [pinNav, setPinNav] = useState(true);
	const [isResizing, setIsResizing] = useState(false);
	const [activeTab, setActiveTab] = useState('document');

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
		let minWidth = 7 * rootSize;
		let maxWidth = 25 * rootSize;
		let widthOffset = rootSize / 4;

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

			setEditorWidth({ ...editorWidth, rightNav: newWidth / rootSize });
		};

		window.addEventListener('mousemove', handleResizeMouseMove);
		window.addEventListener('mouseup', handleResizeMouseUp);
	};

	return (
		<nav
			className={'side-nav right-nav' + (pinNav ? '' : ' hidden')}
			style={{ width: editorWidth.rightNav + 'rem' }}
			ref={navRef}>
			<div
				className='vertical-rule-side-nav-wrapper'
				style={pinNav ? {} : { cursor: 'inherit' }}
				{...(pinNav && {
					onMouseDown: handleResizeMouseDown,
					onDoubleClick: () => resetNavWidth('leftNav'),
				})}>
				<div className={'vertical-rule vr-right-nav' + (isResizing ? ' primary-color' : '')} />
			</div>
			<div className='side-nav-container'>
				<div className='right-nav-top-buttons'>
					<button
						className={'nav-button' + (pinNav ? ' active' : '')}
						onMouseUp={() => {
							setPinNav(!pinNav);
							setEditorWidth({ ...editorWidth, rightIsPinned: !pinNav });
						}}>
						<PushpinSVG />
					</button>
				</div>
				<div className='right-nav-sections'>
					<div
						className={'nav-section-tab first' + (activeTab === 'document' ? ' active' : '')}
						onClick={() => setActiveTab('document')}>
						<DocumentInfoSVG />
					</div>
					<div
						className={'nav-section-tab' + (activeTab === 'tags' ? ' active' : '')}
						onClick={() => setActiveTab('tags')}>
						<TagSingleSVG />
					</div>
					<div
						className={'nav-section-tab last' + (activeTab === 'settings' ? ' active' : '')}
						onClick={() => setActiveTab('settings')}>
						<SettingsDocSVG />
					</div>
				</div>

				<RightNavContent {...{ activeTab }} />

				<div className='right-nav-footer'>
					<div>current version</div>
				</div>
			</div>
		</nav>
	);
};

export default RightNav;
