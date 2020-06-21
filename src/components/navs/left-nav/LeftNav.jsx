import React, { useState } from 'react';

import LeftNavContent from './LeftNavContent';

import PushpinSVG from '../../../assets/svg/PushpinSVG';
import PlusSVG from '../../../assets/svg/PlusSVG';
import CaratDownSVG from '../../../assets/svg/CaratDownSVG';
import DocumentPagesSVG from '../../../assets/svg/DocumentPagesSVG';
import LightbulbSVG from '../../../assets/svg/LightbulbSVG';
import BookDraftSVG from '../../../assets/svg/BookDraftSVG';

const LeftNav = ({ docStructure, setDocStructure, currentDoc, setCurrentDoc }) => {
	const [currentTab, setCurrentTab] = useState('draft');
	return (
		<nav className='side-nav left-nav'>
			<div className='side-nav-container'>
				<div className='left-nav-top-buttons'>
					<button className='nav-button add-file-button'>
						{/* <img src='icons/add.svg' /> */}
						<PlusSVG />
						<span style={{ width: '0.6rem', marginLeft: '0.25rem' }}>
							<CaratDownSVG />
						</span>
					</button>
					<button className='nav-button'>
						{/* <img src='icons/pushpin.svg' /> */}
						<PushpinSVG />
					</button>
				</div>

				<div className='left-nav-sections'>
					<div
						className={'nav-section-tab first' + (currentTab === 'pages' ? ' active' : '')}
						onClick={() => setCurrentTab('pages')}>
						<DocumentPagesSVG />
					</div>
					<div
						className={'nav-section-tab' + (currentTab === 'research' ? ' active' : '')}
						onClick={() => setCurrentTab('research')}>
						<LightbulbSVG />
					</div>
					<div
						className={'nav-section-tab last' + (currentTab === 'draft' ? ' active' : '')}
						onClick={() => setCurrentTab('draft')}>
						<BookDraftSVG />
					</div>
				</div>

				<LeftNavContent
					docStructure={docStructure}
					setDocStructure={setDocStructure}
					currentDoc={currentDoc}
					setCurrentDoc={setCurrentDoc}
					currentTab={currentTab}
				/>

				<div className='left-nav-footer'>
					<p>497 words</p>
					<p>49% today's goal</p>
				</div>
			</div>
			<div className='vertical-rule' style={{ marginLeft: '0.5rem' }}></div>
		</nav>
	);
};

export default LeftNav;
