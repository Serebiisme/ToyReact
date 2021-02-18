const path = require('path');
// module.exports = {
//   mode: 'development',
//   entry: path.join(__dirname, 'src', 'index'),
//   watch: true,
//   output: {
//     path: path.join(__dirname, 'dist'),
//     publicPath: '/dist/',
//     filename: "bundle.js",
//     chunkFilename: '[name].js'
//   },
//   module: {
//     rules: [{
//       test: /.jsx?$/,
//       include: [
//         path.resolve(__dirname, 'app')
//       ],
//       exclude: [
//         path.resolve(__dirname, 'node_modules')
//       ],
//       loader: 'babel-loader',
//       query: {
//         presets: [
//           ["@babel/env", {
//             "targets": {
//               "browsers": "last 2 chrome versions"
//             }
//           }]
//         ]
//       }
//     }]
//   },
//   resolve: {
//     extensions: ['.json', '.js', '.jsx']
//   },
//   devtool: 'source-map',
//   devServer: {
//     contentBase: path.join(__dirname, '/dist/'),
//     inline: true,
//     host: 'localhost',
//     port: 8080,
//   }
// };

module.exports = {
  entry: {
    main: './main.js'
  },
  module: {
    rules: [{
      test: /\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: [
            [
              '@babel/plugin-transform-react-jsx', 
              {
                pragma: 'createElement'
              }
            ]
          ]
        }
      }
    }]
  },
  mode: 'development',
  optimization: {
    minimize: false
  },
  devServer: {
    contentBase: path.join(__dirname, '/dist/')
  }
}