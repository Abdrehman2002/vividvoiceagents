export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { agentId } = req.query
  if (!agentId) return res.status(400).json({ error: 'agentId is required' })

  try {
    const response = await fetch('https://api.retellai.com/v2/list-calls', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RETELL_API_KEY || 'key_52cf8f696d64009de42d4196e27c'}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter_criteria: { agent_id: [agentId] },
        limit: 100,
        sort_order: 'descending',
      }),
    })

    const data = await response.json()
    const raw = Array.isArray(data) ? data : (data.calls || [])

    const calls = raw.map(call => ({
      call_id:          call.call_id,
      from_number:      call.from_number || null,
      to_number:        call.to_number || null,
      started_at:       call.start_timestamp,
      duration_seconds: call.end_timestamp && call.start_timestamp
        ? Math.round((call.end_timestamp - call.start_timestamp) / 1000)
        : null,
      recording_url:    call.recording_url || null,
      transcript:       call.transcript || null,
      analysis:         call.call_analysis?.custom_analysis_data || {},
    }))

    return res.status(200).json({ calls })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch calls', details: err.message })
  }
}
