<?php
// HiqMobi API URL
$apiUrl = 'https://api.hiqmobi.com/api/conversion?api_token=nvqyurckedgax0ajn3x0m5nlehmpk02e5yh4&page=1&limit=10';

// Function to fetch data from HiqMobi API
function fetchConversions($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    curl_close($ch);

    // Decode the JSON response into a PHP array
    return json_decode($response, true);
}

// Fetch the conversions
$data = fetchConversions($apiUrl);

// Check if the API call was successful and data is available
if (isset($data['success']) && $data['success'] == true) {
    $conversions = $data['data']; // Array of conversion data
} else {
    $conversions = [];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HiqMobi Conversions - Admin Panel</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        table, th, td {
            border: 1px solid #ddd;
        }
        th, td {
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        .error {
            color: red;
            font-weight: bold;
        }
    </style>
</head>
<body>

    <h1>HiqMobi Conversions - Admin Panel</h1>

    <?php if (empty($conversions)): ?>
        <p class="error">No conversions found or error fetching data from HiqMobi API.</p>
    <?php else: ?>
        <table>
            <thead>
                <tr>
                    <th>IP Address</th>
                    <th>Goal Name</th>
                    <th>Offer ID</th>
                    <th>Click ID</th>
                    <th>Payout</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($conversions as $conversion): ?>
                    <tr>
                        <td><?php echo htmlspecialchars($conversion['ip']); ?></td>
                        <td><?php echo htmlspecialchars($conversion['goalName']); ?></td>
                        <td><?php echo htmlspecialchars($conversion['offerid']); ?></td>
                        <td><?php echo htmlspecialchars($conversion['clickid']); ?></td>
                        <td><?php echo htmlspecialchars($conversion['payout']); ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>

</body>
</html>
