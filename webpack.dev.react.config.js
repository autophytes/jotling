const HtmlWebPackPlugin = require('html-webpack-plugin');
const path = require('path');

const defaultInclude = path.resolve(__dirname, 'src');

module.exports = {
	// context: defaultInclude,
	entry: './src/index.jsx',
	output: {
		path: path.resolve(__dirname, 'react_dist'),
		filename: 'main.js',
		publicPath: '/',
	},
	devServer: {
		contentBase: './react_dist',
		historyApiFallback: true,
	},
	// devServer: {
	// },
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/, // Changed to fix the .jsx entry point problem
				use: ['babel-loader'],
				include: defaultInclude,
			},
			{
				test: /\.css$/,
				use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
				include: defaultInclude,
			},
			{
				test: /\.js$/,
				use: ['worker-loader', 'babel-loader'],
				// use: [{ loader: 'worker-loader' }, { loader: 'babel-loader' }],
				include: [path.join(__dirname, 'webWorkers')],
			},
			{
				test: /\.(jpe?g|png|gif)$/,
				use: [{ loader: 'file-loader?name=img/[name]__[hash:base64:5].[ext]' }],
				include: defaultInclude,
			},
			{
				test: /\.(eot|svg|ttf|woff|woff2)$/,
				use: [{ loader: 'file-loader?name=font/[name]__[hash:base64:5].[ext]' }],
				include: defaultInclude,
			},
		],
	},
	resolve: {
		extensions: ['.js', '.jsx'],
	},
	plugins: [
		new HtmlWebPackPlugin({
			template: path.resolve(__dirname, 'public/index.html'),
			filename: 'index.html',
		}),
	],
};
