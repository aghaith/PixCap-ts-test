interface Employee {
    uniqueId: number;
    name: string;
    subordinates: Employee[];
}
let employeeInfo = {} as Employee;
const ceo: Employee = {
    uniqueId: 1,
    name: 'Mark Zuckerberg',
    subordinates: [employeeInfo]
}
interface IEmployeeOrgApp {
    ceo: Employee;
    move(employeeID: number, supervisorID: number): void;
    undo(): void;
    redo(): void;
}
class EmployeeOrgApp implements IEmployeeOrgApp {
    ceo: Employee;
    lastMove: {
        oldSupervisor: Employee, 
        newSupervisor: Employee, 
        employee: Employee, 
        subordinatesEmployeesIds : number[]
    } | null;
    lastUndo: {
        employeeId: number;
        supervisorId: number;
    } | null;
    constructor (ceo: Employee) {
        this.ceo = ceo;
        this.lastMove = null;
        this.lastUndo = null;
    }
    move(employeeID: number, supervisorID: number): void {
        const employeeAndSupervisor = this.getEmployee(ceo, employeeID)
        if (employeeAndSupervisor == null) {
            return;
        }

        const supervisorAndSupervisor = this.getEmployee(ceo, supervisorID)
        if (supervisorAndSupervisor == null) {
            return;
        }

        const { employee, supervisor:oldSupervisor } = employeeAndSupervisor;
        const { employee: newSupervisor } = supervisorAndSupervisor;

        // remove employee from the old supervisor
        oldSupervisor.subordinates = oldSupervisor.subordinates.filter(subordinate => subordinate.uniqueId != employeeID)

        // move subordinate of the employee to the old supervisor
        oldSupervisor.subordinates.push(...employee.subordinates);

        // store subordinates employees Ids
        const subordinatesEmployeesIds = employee.subordinates.map(subordinate => subordinate.uniqueId)

        // clear subordinates for new employee
        employee.subordinates = []

        // move employee to new supervisor
        newSupervisor.subordinates.push(employee);

        // store oldSupervisor, newSupervisor, employee and Id list of employee's subordinates
        this.lastMove = {
            oldSupervisor,
            newSupervisor,
            employee,
            subordinatesEmployeesIds
        }
    }
    getEmployee(supervisor: Employee, employeeID: number) : {employee : Employee, supervisor : Employee} | null {
        for (const subordinate of supervisor.subordinates) {
            if (subordinate.uniqueId == employeeID) {
                return {
                    employee : subordinate,
                    supervisor
                }
            }
            const employeeAndSupervisor = this.getEmployee(subordinate, employeeID);
            if (employeeAndSupervisor != null) {
                return employeeAndSupervisor;
            }
        }
        return null;
    } 
    undo(): void {
        if (this.lastMove == null) {
            return;
        }
        const { oldSupervisor, newSupervisor, employee, subordinatesEmployeesIds } = this.lastMove;
        // move employee to the old supervisor
        oldSupervisor.subordinates.push(employee)
        // remove employee from the new supervisor
        newSupervisor.subordinates = newSupervisor.subordinates.filter(subordinate => subordinate.uniqueId != employee.uniqueId)
        // move the subordinate to the employee
        employee.subordinates = oldSupervisor.subordinates.filter(subordinate => subordinatesEmployeesIds.includes(subordinate.uniqueId))
        // remove the subordinates from the old supervisor
        oldSupervisor.subordinates = oldSupervisor.subordinates.filter(subordinate => !subordinatesEmployeesIds.includes(subordinate.uniqueId))
        // clear last move
        this.lastMove = null;
        // store employeeId and supervisorId in lastUndo
        this.lastUndo = {
            employeeId : employee.uniqueId,
            supervisorId: newSupervisor.uniqueId
        }
    }
    redo(): void {
        if (this.lastUndo == null) {
            return;
        }
        this.move(this.lastUndo?.employeeId, this.lastUndo?.supervisorId);
        // clear lastUndo
        this.lastUndo = null;
    }
}
const app = new EmployeeOrgApp(ceo)
