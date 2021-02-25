import React, { Component } from 'react';
import DVideo from '../abis/DVideo.json'
import Navbar from './Navbar'
import Main from './Main'
import Web3 from 'web3';
import './App.css';

//Declare IPFS
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    //Load accounts
    const accounts = await web3.eth.getAccounts()
    console.log(accounts)
    //Add first account the the state
    this.setState({account: accounts[0]})

    //Get network ID
    const networkId = await web3.eth.net.getId()
    //Get network data
    const networkData = DVideo.networks[networkId]
    //Check if net data exists, then
      //Assign dvideo contract to a variable
      //Add dvideo to the state
      if(networkData){
        const dVideo = new web3.eth.Contract(DVideo.abi, networkData.address)
        this.setState({dVideo})
        console.log(dVideo)

        //Check videoAmounts
      //Add videAmounts to the state
        const videoCounts = await dVideo.methods.videoCount().call()
        this.setState({videoCounts})
        console.log("Video Count ===>",videoCounts)

        //Iterate throught videos and add them to the state (by newest)
        for(var i = videoCounts;i>=1;i--){
          const video = await dVideo.methods.videos(i).call()
          this.setState({
            videos: [...this.state.videos, video]
          })
        }

        //Set latest video and it's title to view as default 
        const latest = await dVideo.methods.videos(videoCounts).call()
        console.log("Latest Title==>",latest.title)
        this.setState({
          currentHash: latest.hash,
          currentTitle: latest.title
        })
      //Set loading state to false
      this.setState({loading: false})
      console.log("TITLE STATE NAME ==>", this.state.currentTitle)



      }else{
        window.alert("dVideo contract has not been deployed to detect ntework")
      }

      


      

      //If network data doesn't exisits, log error
  }

  //Get video
   captureFile = event => {
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)

    reader.onloadend = () => {
      this.setState({buffer: Buffer(reader.result)})
      console.log("buffer", this.state.buffer)
    }

  }

  //Upload video
  uploadVideo = title => {
    console.log('submitting file to IPFS')

    ipfs.add(this.state.buffer,(error,result)=> {
      console.log(result)
      if(error){
        console.log(error)
        return error;
      }

      this.setState({loading: true})
      this.state.dVideo.methods.uploadVideo(result[0].hash,title).send({from: this.state.account}).on('transactionHash',(hash)=>{
        this.setState({loading:false})
      })

    })
  }

  //Change Video
  changeVideo = (hash, title) => {
    this.setState({currentHash: hash})
    this.setState({currentTitle: title})

  }

  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      account: '',
      dVideo: null,
      videos: [],
      buffer: null,
      currentHash: null,
      currentTitle: null,
      videoCounts: 0
    }

    //Bind functions
  }

  render() {
    return (
      <div>
        <Navbar 
          account={this.state.account}
        />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
              captureFile={this.captureFile}
              videos={this.state.videos}
              uploadVideo={this.uploadVideo}
              changeVideo={this.changeVideo}
              currentHash={this.state.currentHash}
              title={this.state.currentTitle}
            />
        }
      </div>
    );
  }
}

export default App;