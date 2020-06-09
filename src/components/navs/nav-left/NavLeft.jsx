import React from 'react';
import PushpinSVG from '../../../assets/svg/PushpinSVG';
import PlusSVG from '../../../assets/svg/PlusSVG';
import CaratDownSVG from '../../../assets/svg/CaratDownSVG';
import DocumentPagesSVG from '../../../assets/svg/DocumentPagesSVG';
import LightbulbSVG from '../../../assets/svg/LightbulbSVG';
import BookDraftSVG from '../../../assets/svg/BookDraftSVG';

const NavLeft = () => {
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
					<div className='nav-section-tab first'>
						{/* <img src='icons/pages.svg' /> */}
						<DocumentPagesSVG />
					</div>
					<div className='nav-section-tab'>
						{/* <img src='icons/lamp.svg' /> */}
						<LightbulbSVG />
					</div>
					<div className='nav-section-tab last active'>
						{/* <img src='icons/book (2).svg' /> */}
						<BookDraftSVG />
					</div>
				</div>
				<div className='left-nav-content'>
					<div className='file-nav folder'>
						<p className='file-nav folder title'>Chapter 1</p>
						<div className='folder-contents'>
							<p className='file-nav document'>Sub 1</p>
							<div className='file-nav folder'>
								<p className='file-nav folder title'>Sub 2</p>
								<div className='folder-contents'>
									<p className='file-nav document'>Sub sub 1</p>
									<p className='file-nav document'>Sub sub 2</p>
									<p className='file-nav document'>Sub sub 3</p>
								</div>
							</div>
						</div>
					</div>
					<p className='file-nav document'>Chapter 2</p>
					<p className='file-nav document'>Chapter 3</p>
					<p className='file-nav document'>Chapter 4</p>
					<p className='file-nav document'>Chapter 5</p>
				</div>
				<div className='left-nav-footer'>
					<p>497 words</p>
					<p>49% today's goal</p>
				</div>
			</div>
			<div className='vertical-rule' style={{ marginLeft: '0.5rem' }}></div>
		</nav>
	);
};

export default NavLeft;
