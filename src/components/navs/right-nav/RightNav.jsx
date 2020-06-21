import React from 'react';

import PushpinSVG from '../../../assets/svg/PushpinSVG';
import TagSingleSVG from '../../../assets/svg/TagSingleSVG';
import SettingsDocSVG from '../../../assets/svg/SettingsDocSVG';
import DocumentInfoSVG from '../../../assets/svg/DocumentInfoSVG';

const RightNav = () => {
	return (
		<nav className='side-nav right-nav'>
			<div className='vertical-rule' style={{ marginRight: '0.5rem' }}></div>
			<div className='side-nav-container'>
				<div className='right-nav-top-buttons'>
					<button className='nav-button'>
						{/* <img src='icons/pushpin.svg' /> */}
						<PushpinSVG />
					</button>
				</div>
				<div className='right-nav-sections'>
					<div className='nav-section-tab first active'>
						{/* <img src='icons/guide-book.svg' /> */}
						<DocumentInfoSVG />
					</div>
					<div className='nav-section-tab'>
						{/* <img src='icons/price-tag.svg' /> */}
						<TagSingleSVG />
					</div>
					<div className='nav-section-tab last'>
						{/* <img src='icons/document-settings.svg' /> */}
						<SettingsDocSVG />
					</div>
				</div>
				<div className='right-nav-content'>
					<p className='file-nav folder'>Chapter 1</p>
					<p className='file-nav document'>Sub 1</p>
					<p className='file-nav folder'>Sub 2</p>
					<p className='file-nav document'>Sub sub 1</p>
					<p className='file-nav document'>Sub sub 2</p>
					<p className='file-nav document'>Sub sub 3</p>
					<p className='file-nav document'>Chapter 2</p>
					<p className='file-nav document'>Chapter 3</p>
					<p className='file-nav document'>Chapter 4</p>
					<p className='file-nav document'>Chapter 5</p>
				</div>
				<div className='right-nav-footer'>
					<div>current version</div>
				</div>
			</div>
		</nav>
	);
};

export default RightNav;
