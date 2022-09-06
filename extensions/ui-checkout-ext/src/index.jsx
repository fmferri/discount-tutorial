import React from 'react';
import {
  useExtensionApi,
  render,
  Banner,
  useTranslate,
} from '@shopify/checkout-ui-extensions-react';
import { useEffect, useState } from 'react';

render('Checkout::Dynamic::Render', () => <App />);

function App() {
  const {extensionPoint} = useExtensionApi();
  const translate = useTranslate();
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState('ancora nulla');
  useEffect( async () => {
    setLoading(true);
    console.log('CIAO')
    try {
      const response = await fetch('https://httpbin.org/ip', {
        mode: 'cors',
        credentials: "same-origin",
        headers: {
          'Access-Control-Allow-Origin':'*',
          'Bypass-Tunnel-Reminder': 'true'
        }
      })
        .then(response => response.json())
        .then( data => {
          console.log('RESPONSE IS ', data)
          setDataLoaded(JSON.stringify(data))
        })
    }
    catch (error) {
      // setIp('NADA')
      console.log('ERROR', error)
    }
  }, []);
  
  return (
    <Banner
        title="TEST DISCOUNT"
        status="info"
      >
      CIAONE 3 {dataLoaded}
    </Banner>
  )
}
