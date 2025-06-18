Sending from crm

========== Incoming WhatsApp Webhook ==========
{
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '2397247370638220',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556584281',
              phone_number_id: '587890621084018'
            },
            statuses: [
              {
                id: 'wamid.HBgMOTcxNTQ3NTE2Mzg3FQIAERgSMTFFOENBRUNGRTBGQjg1MEE2AA==',
                status: 'sent',
                timestamp: '1750144587',
                recipient_id: '971547516387',
                conversation: {
                  id: '83cfa39dd347473ec3e6244fd48709f6',
                  expiration_timestamp: '1750156620',
                  origin: { type: 'service' }
                },
                pricing: {
                  billable: true,
                  pricing_model: 'CBP',
                  category: 'service'
                }
              }
            ]
          },
          field: 'messages'
        }
      ]
    }
  ]
}
========== End of Webhook ==========
========== Incoming WhatsApp Webhook ==========
{
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '2397247370638220',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556584281',
              phone_number_id: '587890621084018'
            },
            statuses: [
              {
                id: 'wamid.HBgMOTcxNTQ3NTE2Mzg3FQIAERgSMTFFOENBRUNGRTBGQjg1MEE2AA==',
                status: 'delivered',
                timestamp: '1750144588',
                recipient_id: '971547516387',
                conversation: {
                  id: '83cfa39dd347473ec3e6244fd48709f6',
                  origin: { type: 'service' }
                },
                pricing: {
                  billable: true,
                  pricing_model: 'CBP',
                  category: 'service'
                }
              }
            ]
          },
          field: 'messages'
        }
      ]
    }
  ]
}
========== End of Webhook ==========


Incoming from whatsapp

========== Incoming WhatsApp Webhook ==========
{
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '2397247370638220',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556584281',
              phone_number_id: '587890621084018'
            },
            contacts: [
              {
                profile: { name: 'Chamara Dissanayake' },
                wa_id: '971547516387'
              }
            ],
            messages: [
              {
                from: '971547516387',
                id: 'wamid.HBgMOTcxNTQ3NTE2Mzg3FQIAEhgWM0VCMDYxQTVGOTU0OURFOERBRDhGNQA=',
                timestamp: '1750144699',
                text: { body: 'Test receiving' },
                type: 'text'
              }
            ]
          },
          field: 'messages'
        }
      ]
    }
  ]
}
========== End of Webhook ==========


    console.log("========== Incoming WhatsApp Webhook ==========");
    console.dir(data, { depth: null, colors: true });
    console.log("========== End of Webhook ==========");