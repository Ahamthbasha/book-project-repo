
const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate());
const maxDate = tomorrow.toISOString().split('T')[0];

// {{!-- document.getElementById("start-date").setAttribute("min", today) --}}
document.getElementById("start-date").setAttribute("max", maxDate);
document.getElementById("end-date").setAttribute("min", today)
document.getElementById("end-date").setAttribute("max", maxDate);

// Ensure end date is greater than start date
var startDateField = document.getElementById("start-date");
var endDateField = document.getElementById("end-date");

startDateField.addEventListener("change", function () {
    endDateField.setAttribute("min", startDateField.value);
});

endDateField.addEventListener("change", function () {
    startDateField.setAttribute("max", endDateField.value);
});


const getSalesData = async() => {
const startDate = document.getElementById('start-date').value
const endDate =document.getElementById('end-date').value
 console.log(startDate, endDate) 



 Handlebars.registerHelper("for", function(from, to, incr, block) {
  var accum = '';
  for(var i = from; i < to; i += incr)
      accum += block.fn(i);
  return accum;
});



 // Define Handlebars template
const salesReportTemplate = `
<div class="col-xl-12">
  <!-- Account details card-->
  <div class="card mb-4">
    <div class="card-header">Sales Report 

    </div>

    <div class="card-body ml-3 p-5">
      <ul>   
        <table id="my-table" class="my-table table table-hover" style="border-top: 1px solid black;">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Order id</th>
              <th scope="col">Payment Method</th>
              <th scope="col">Coupon</th>
              <th scope="col">Coupon Used</th>
              <th scope="col">Product Details</th>
              <th scope="col">Total</th>
              
            </tr>
          </thead>
          <tbody>
            {{#each data.orders}}
            <tr>
              <td>{{this.date}}</td>
              <td>{{this.orderId}}</td>
              <td>{{this.payMethod}}</td> 
              <td>{{this.coupon}}</td>
              <td>{{this.couponUsed}}</td>
              <td>
                 {{#each this.proName}}
                 <p>Name: {{this.name}}</p>
                 <p>Quantity: {{this.quantity}}</p>
                 <p>Price: <span>₹</span>{{this.price}}</p>
                 <p>Discount Amount: <span>₹</span>{{this.discountAmt}}</p>
                 <p>DeliveryCharge:50</p>
                 {{/each}}
                 </td> 
            
              <td><span>₹</span>{{total}}</td> 
            </tr>
            {{/each}} 
          </tbody>
        </table>
                
        <h5>Total Revenue: ₹<strong class="ml-auto">{{data.grandTotal}}</strong>  </h5>
        <h5>Total Sales Count: <strong>{{data.salesCount}}</strong></h5>
        <h5>Total Discount Amount: ₹<strong class="ml-auto">{{data.overallDiscountAmount}}</strong></h5>
      </ul>
    </div>
  </div>
</div>
`;


function renderSalesReport(data) {
  const compiledTemplate = Handlebars.compile(salesReportTemplate);
  const salesReportHTML = compiledTemplate({ data: data });
  document.getElementById('table').innerHTML = salesReportHTML;

  // Update the DataTable configuration
  $(document).ready(function () {
    $('#my-table').DataTable({
      dom: 'Bfrtip',
      buttons: [
        {
          extend: 'excelHtml5',
          text: 'Excel',
          exportOptions: {
            columns: ':visible'  // Export visible columns
          }
        },
        {
          extend: 'pdfHtml5',
          text: 'PDF',
          customize: function (doc) {
            // Extract the totals from the passed data
            const grandTotal = data.grandTotal;
            const salesCount = data.salesCount;
            const overallDiscountAmount = data.overallDiscountAmount;

            // Add the totals to the footer of the PDF
            doc.content.push({
              text: [
                `Total Revenue: ₹${grandTotal}`,
                `Total Sales Count: ${salesCount}`,
                `Total Discount Amount: ₹${overallDiscountAmount}`
              ],
              margin: [0, 20, 0, 0],  // Add some margin space to the footer
              alignment: 'left'
            });
          }
        }
      ]
    });
  });
}

// Fetch the sales data
  const response = await fetch(`/admin/get_sales?stDate=${startDate}&edDate=${endDate}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();
  console.log(data);

  if (data) {
    renderSalesReport(data); // Render the sales report
  }
};
