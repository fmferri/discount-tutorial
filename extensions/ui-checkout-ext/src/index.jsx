import React from 'react';
import {
  useExtensionApi,
  render,
  Banner,
  useTranslate,
  useApplyAttributeChange,
  useApplyMetafieldsChange,
  useAttributes
} from '@shopify/checkout-ui-extensions-react';
import { useEffect, useState } from 'react';

render('Checkout::Dynamic::Render', () => <App />);

function App() {
  const {extensionPoint} = useExtensionApi();
  const applyAttributeChange = useApplyAttributeChange();
  const applyMetafieldsChange = useApplyMetafieldsChange();
  const attributes = useAttributes();
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
          
          try{
            applyAttributeChange({
              key: 'discount',
              type: 'updateAttribute',
              value: "50"
            }).then((data) => {
              console.log('ATTRIBUTES', data)
            }).then(() => {
              console.log('ATT', attributes)
            })
          } catch(e){
            console.log('ERROR IN useApplyAttributeChange', e)
          }
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
      CIAONE 4 {dataLoaded}
    </Banner>
  )
}
